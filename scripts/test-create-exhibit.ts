import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    const value = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, "") : "";
    process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExhibitRegistration() {
  console.log("🧪 Starting Exhibit Registration Test...\n");

  const testEmail = process.env.TEST_USER_EMAIL || "test_runner@anokoro.local";
  const testPassword = process.env.TEST_USER_PASSWORD || "TestRunnerPassword123!";

  const signInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  let user = signInResult.data.user;
  let session = signInResult.data.session;

  if (!user || !session) {
    const signUpResult = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    user = signUpResult.data.user;
    session = signUpResult.data.session;
  }

  if (!user || !session) {
    console.error("❌ Authentication failed: Session not created");
    console.error("\n⚠️ Test finished with errors.");
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Authenticated! User ID: ${user.id}\n`);

  const userId = user.id;

  const mockItem = {
    title: "たまごっち (テスト登録)",
    description: "お腹がすいたらピピッとお知らせ。授業中に鳴らないかヒヤヒヤしながら育てていました。",
    category: "ゲーム",
    year: 1996,
    imageFileName: "youkai-watch.png",
  };

  const imagesDir = path.join(process.cwd(), "public/mock-images");
  const imagePath = path.join(imagesDir, mockItem.imageFileName);

  if (!fs.existsSync(imagePath)) {
    console.error("❌ Image file not found:", imagePath);
    console.error("\n⚠️ Test finished with errors.");
    process.exitCode = 1;
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const ext = mockItem.imageFileName.split(".").pop() || "png";
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const fileName = `${userId}/${Date.now()}_test_${crypto.randomUUID()}.${ext}`;

  let uploadedStoragePath: string | null = null;
  let insertedItemId: string | null = null;
  let hasError = false;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exhibits")
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error("❌ Storage upload failed:", uploadError?.message);
      hasError = true;
      process.exitCode = 1;
    } else {
      uploadedStoragePath = uploadData.path;

      const { data: publicData } = supabase.storage.from("exhibits").getPublicUrl(uploadedStoragePath);
      const imageUrl = publicData.publicUrl;
      console.log(`✅ Storage upload succeeded! Public URL: ${imageUrl}\n`);

      const { data: newItem, error: insertError } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          title: mockItem.title,
          description: mockItem.description,
          category: mockItem.category,
          year: mockItem.year,
          image_url: imageUrl,
        })
        .select("id, title, category, year, image_url, created_at")
        .single();

      if (insertError || !newItem) {
        console.error("❌ DB insert failed:", insertError?.message);
        hasError = true;
        process.exitCode = 1;
      } else {
        insertedItemId = newItem.id;

        console.log(`✅ DB insert succeeded!`);
        console.log(`   ID: ${newItem.id}`);
        console.log(`   Title: ${newItem.title}`);
        console.log(`   Category: ${newItem.category} / Year: ${newItem.year}`);
        console.log(`   Image URL: ${newItem.image_url}`);
        console.log(`   Created At: ${newItem.created_at}\n`);
      }
    }
  } finally {
    if (insertedItemId) {
      const { error: deleteDbError } = await supabase.from("items").delete().eq("id", insertedItemId);
      if (deleteDbError) {
        console.error("⚠️ Failed to clean up test DB item:", deleteDbError.message);
        hasError = true;
        process.exitCode = 1;
      } else {
        console.log("🧹 Test DB item cleaned up.");
      }
    }

    if (uploadedStoragePath) {
      const { error: deleteStorageError } = await supabase.storage
        .from("exhibits")
        .remove([uploadedStoragePath]);
      if (deleteStorageError) {
        console.error("⚠️ Failed to clean up test storage object:", deleteStorageError.message);
        hasError = true;
        process.exitCode = 1;
      } else {
        console.log("🧹 Test storage image cleaned up.");
      }
    }
  }

  if (hasError || process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Exhibit Registration Test Complete!");
  }
}

testExhibitRegistration();
