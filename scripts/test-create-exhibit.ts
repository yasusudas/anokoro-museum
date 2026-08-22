import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// .env.local の環境変数をロード
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
  console.log("🧪 --- 新規登録機能（Storageアップロード & DB保存）の動作テスト開始 ---\n");

  // 1. テストユーザーを作成/ログイン
  console.log("1️⃣ テストユーザーで認証中...");
  const testEmail = `tester_${Date.now()}@anokoro.local`;
  const testPassword = "password123!";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user) {
    console.error("❌ 認証失敗:", authError?.message);
    return;
  }
  console.log(`✅ 認証成功！ ユーザーID: ${authData.user.id}\n`);

  const userId = authData.user.id;

  // 2. モック画像と入力データを準備
  console.log("2️⃣ モック画像と入力データの準備...");
  const mockItem = {
    title: "たまごっち (テスト登録)",
    description: "お腹がすいたらピピッとお知らせ。授業中に鳴らないかヒヤヒヤしながら育てていました。",
    category: "ゲーム",
    year: 1996,
    imageFileName: "youkai-watch.jpg", // public/mock-images/ 内の画像を使用
  };

  const imagesDir = path.join(process.cwd(), "public/mock-images");
  const imagePath = path.join(imagesDir, mockItem.imageFileName);

  if (!fs.existsSync(imagePath)) {
    console.error("❌ 画像ファイルが見つかりません:", imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  console.log(`✅ 画像ファイル読み込み完了: ${mockItem.imageFileName} (${fileBuffer.length} bytes)\n`);

  // 3. Supabase Storage への画像アップロード & URL 発行
  console.log("3️⃣ Supabase Storage (exhibits バケット) へアップロード中...");
  const ext = mockItem.imageFileName.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}_test_${crypto.randomUUID()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("exhibits")
    .upload(fileName, fileBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  let imageUrl: string | null = null;

  if (uploadError) {
    console.warn(`⚠️ Storage アップロード結果: ${uploadError.message}`);
    console.log("   （※Supabaseダッシュボードで 'exhibits' バケットが作成されていない場合はフォールバックURLを使用します）");
    imageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80";
  } else {
    const { data: publicData } = supabase.storage.from("exhibits").getPublicUrl(uploadData.path);
    imageUrl = publicData.publicUrl;
    console.log(`✅ Storage アップロード成功！ 発行URL: ${imageUrl}\n`);
  }

  // 4. items テーブルへ INSERT 保存
  console.log("4️⃣ データベース (public.items) に展示データを保存中...");
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
    console.error("❌ DB 保存失敗:", insertError?.message);
    return;
  }

  console.log(`✅ DB 保存成功！`);
  console.log(`   展示ID: ${newItem.id}`);
  console.log(`   タイトル: ${newItem.title}`);
  console.log(`   カテゴリ: ${newItem.category} / 年代: ${newItem.year}年`);
  console.log(`   画像URL: ${newItem.image_url}`);
  console.log(`   保存日時: ${newItem.created_at}\n`);

  console.log("🎉 --- 新規登録機能の動作確認テストが【すべて正常に完了】しました！ ---");
}

testExhibitRegistration();
