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

const mockExhibits = [
  {
    id: "abccab1c-030a-46ca-a77e-403558a7b4e3",
    title: "ひもQ",
    description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。",
    category: "おかし",
    year: 2004,
    imageFileName: "himo-q.jpg",
    created_at: "2026-08-01T00:00:00+09:00",
  },
  {
    id: "96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29",
    title: "妖怪ウォッチ",
    description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。",
    category: "ゲーム",
    year: 2013,
    imageFileName: "youkai-watch.png",
    created_at: "2026-08-01T01:00:00+09:00",
  },
  {
    id: "01b2a5ce-d7f5-48a5-83be-c02acbe44673",
    title: "タピオカ",
    description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。",
    category: "たべもの",
    year: 2018,
    imageFileName: "tapioka.jpg",
    created_at: "2026-08-01T02:00:00+09:00",
  },
  {
    id: "f5336f5e-34f3-4dad-b26a-516a70e92e1f",
    title: "かいけつゾロリ",
    description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。",
    category: "ほん",
    year: 2000,
    imageFileName: "zorori.jpg",
    created_at: "2026-08-01T03:00:00+09:00",
  },
  {
    id: "5fbf3448-5776-4765-8676-8a7a7ca7531f",
    title: "ソーラン節",
    description: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。",
    category: "できごと",
    year: 2005,
    imageFileName: "soran-bushi.png",
    created_at: "2026-08-01T04:00:00+09:00",
  },
  {
    id: "052dd450-347a-4166-8b4c-da075e9a796d",
    title: "あつまれ どうぶつの森",
    description: "無人島でのDIY生活や、オンラインで友達の島に遊びに行くのがおうち時間の定番でした。",
    category: "ゲーム",
    year: 2020,
    imageFileName: "doubutsu-no-mori.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "5a802a54-d1eb-490d-a167-53714978ffeb",
    title: "ニンテンドー3DS",
    description: "裸眼立体視の3D映像やすれちがい通信にワクワクした。すれちがいMii広場のピース集めも夢中でした。",
    category: "ゲーム",
    year: 2011,
    imageFileName: "3ds.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "3bf75231-81b2-4701-a1f5-2a28ec4918b5",
    title: "ガラケー",
    description: "メアド交換は赤外線通信！携帯をピタッとくっつけて受信して、キラキラのデコメで返信するのが定番でした。",
    category: "ガジェット",
    year: 2007,
    imageFileName: "garakei.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
];

async function seedStorageItems() {
  console.log("🚀 Starting Supabase Storage Upload & DB Seeding...\n");

  const seedEmail = process.env.SEED_USER_EMAIL || "seed_uploader@anokoro.local";
  const seedPassword = process.env.SEED_USER_PASSWORD || "SeedPassword123!";

  const signInResult = await supabase.auth.signInWithPassword({
    email: seedEmail,
    password: seedPassword,
  });

  let user = signInResult.data.user;
  let session = signInResult.data.session;

  if (!user || !session) {
    const signUpResult = await supabase.auth.signUp({
      email: seedEmail,
      password: seedPassword,
    });
    user = signUpResult.data.user;
    session = signUpResult.data.session;
  }

  if (!user || !session) {
    console.error("❌ Authentication error: Session not created");
    process.exitCode = 1;
    return;
  }

  const userId = user.id;
  console.log(`✅ Authenticated as seed uploader (UID: ${userId})\n`);

  const imagesDir = path.join(process.cwd(), "public/mock-images");
  let hasFailure = false;

  for (const item of mockExhibits) {
    let imageUrl: string | null = null;

    if (item.imageFileName) {
      const localFilePath = path.join(imagesDir, item.imageFileName);

      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const ext = item.imageFileName.split(".").pop() || "jpg";
        const storagePath = `${userId}/mock_${item.id}_${Date.now()}.${ext}`;
        const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        const { error: uploadError } = await supabase.storage
          .from("exhibits")
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error(`⚠️ Failed to upload image for ${item.title}:`, uploadError.message);
          hasFailure = true;
        } else {
          const { data: publicData } = supabase.storage
            .from("exhibits")
            .getPublicUrl(storagePath);

          imageUrl = publicData.publicUrl;
          console.log(`📁 Uploaded to Storage: ${item.title} -> ${imageUrl}`);
        }
      } else {
        console.warn(`⚠️ Local file not found: ${localFilePath}`);
        hasFailure = true;
      }
    }

    if (!imageUrl) {
      console.warn(`⏭️ Skipped DB upsert for ${item.title} due to missing image.`);
      hasFailure = true;
      continue;
    }

    const { error: dbError } = await supabase.from("items").upsert(
      {
        id: item.id,
        user_id: userId,
        title: item.title,
        description: item.description,
        category: item.category,
        year: item.year,
        image_url: imageUrl,
        created_at: item.created_at,
      },
      { onConflict: "id" }
    );

    if (dbError) {
      console.error(`❌ DB Upsert Error for ${item.title}:`, dbError.message);
      hasFailure = true;
    } else {
      console.log(`✅ DB Saved: ${item.title}`);
    }
  }

  const { data: allItems, error: selectError } = await supabase
    .from("items")
    .select("id, title, category, year, image_url")
    .order("created_at", { ascending: true });

  if (selectError) {
    console.error("❌ Failed to verify seeded items from DB:", selectError.message);
    hasFailure = true;
  }

  if (hasFailure) {
    console.error("\n⚠️ Seeding finished with errors.");
    process.exitCode = 1;
    return;
  }

  console.log(`\n🎉 Seeding Complete! Total items in DB: ${allItems?.length}\n`);
  console.table(allItems);
}

seedStorageItems();
