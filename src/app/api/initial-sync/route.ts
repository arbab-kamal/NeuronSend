import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Set batch size and limit maxDuration to Vercel's allowed range (max 60s for hobby)
const BATCH_SIZE = 50;

export const POST = async (req: NextRequest) => {
    const body = await req.json();
    const { accountId, userId } = body;
    if (!accountId || !userId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId,
        },
    });
    if (!dbAccount) return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });

    const account = new Account(dbAccount.token);
    await account.createSubscription();

    // Perform batch-based synchronization
    const { deltaToken, success } = await performInitialSync(account, accountId);

    if (!success) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });

    // Update the database with the new delta token
    await db.account.update({
        where: {
            token: dbAccount.token,
        },
        data: {
            nextDeltaToken: deltaToken,
        },
    });

    console.log("sync complete", deltaToken);
    return NextResponse.json({ success: true, deltaToken }, { status: 200 });
};

// Batch-based email sync logic
const performInitialSync = async (account, accountId) => {
    let allEmails = [];
    let deltaToken = null;
    let response = await account.fetchEmails(BATCH_SIZE);

    try {
        while (response && response.emails.length > 0) {
            // Sync the current batch of emails to the database
            await syncEmailsToDatabase(response.emails, accountId);
            allEmails = allEmails.concat(response.emails);
            deltaToken = response.deltaToken;

            // Fetch next batch
            response = await account.fetchEmails(BATCH_SIZE, deltaToken);
        }

        return { deltaToken, success: true };
    } catch (error) {
        console.error("Error during email sync", error);
        return { success: false };
    }
};
