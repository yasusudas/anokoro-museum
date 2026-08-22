import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { checkDuplicateExhibitTitle } from "../features/exhibits/queries/check-duplicate-title";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      const value = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, "") : "";
      process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDuplicateTitleFlow() {
  console.log("🧪 Starting Duplicate Title Check Test...\n");

  const testEmail = process.env.TEST_USER_EMAIL || "test_runner@anokoro.local";
  const testPassword = process.env.TEST_USER_PASSWORD || "TestRunnerPassword123!";

  const signInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  const user = signInResult.data.user;
  if (!user || signInResult.error) {
    console.error("❌ Authentication failed:", signInResult.error?.message);
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Authenticated user: ${user.id}`);

  const { data: existingItem, error: fetchError } = await supabase
    .from("items")
    .select("id, title")
    .limit(1)
    .single();

  if (fetchError || !existingItem) {
    console.error("❌ Failed to fetch existing exhibit item:", fetchError?.message);
    process.exitCode = 1;
    return;
  }

  console.log(`📌 Existing Exhibit in DB: "${existingItem.title}" (${existingItem.id})\n`);

  const { isDuplicate: actionDuplicateResult } = await checkDuplicateExhibitTitle(supabase, existingItem.title);
  if (actionDuplicateResult === true) {
    console.log(`✅ Duplicate check correctly detected duplicate: "${existingItem.title}"`);
  } else {
    console.error("❌ Duplicate check failed to detect duplicate!");
    process.exitCode = 1;
  }

  const uniqueTitle = `まったく新しい寄贈品_${Date.now()}`;
  const { isDuplicate: actionUniqueResult } = await checkDuplicateExhibitTitle(supabase, uniqueTitle);
  if (actionUniqueResult === false) {
    console.log(`✅ Duplicate check passed for unique title: "${uniqueTitle}"`);
  } else {
    console.error("❌ False positive on unique title!");
    process.exitCode = 1;
  }

  if (process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Duplicate Title Validation Logic Test Passed!");
  }
}

testDuplicateTitleFlow();
