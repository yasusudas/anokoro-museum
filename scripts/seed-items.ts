import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

const dummyUserId = "11111111-1111-1111-1111-111111111111";

const exhibits = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: dummyUserId,
    title: "ひもQ",
    description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。",
    category: "おかし",
    year: 2004,
    image_url: null,
    created_at: "2026-08-01T00:00:00+09:00",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: dummyUserId,
    title: "妖怪ウォッチ",
    description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。",
    category: "ゲーム",
    year: 2013,
    image_url: null,
    created_at: "2026-08-01T01:00:00+09:00",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: dummyUserId,
    title: "タピオカ",
    description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。",
    category: "たべもの",
    year: 2018,
    image_url: null,
    created_at: "2026-08-01T02:00:00+09:00",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    user_id: dummyUserId,
    title: "かいけつゾロリ",
    description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。",
    category: "ほん",
    year: 2000,
    image_url: null,
    created_at: "2026-08-01T03:00:00+09:00",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    user_id: dummyUserId,
    title: "ソーラン節",
    description: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。",
    category: "できごと",
    year: 2005,
    image_url: null,
    created_at: "2026-08-01T04:00:00+09:00",
  },
];

async function run() {
  console.log("Seeding exhibits to DB...");
  for (const exhibit of exhibits) {
    const { error } = await supabase
      .from("items")
      .upsert(exhibit, { onConflict: "id" });

    if (error) {
      console.error(`Error inserting ${exhibit.title}:`, error);
    } else {
      console.log(`✓ Inserted / Updated: ${exhibit.title}`);
    }
  }

  const { data: allItems } = await supabase
    .from("items")
    .select("id, title, category, year, description")
    .order("created_at", { ascending: true });

  console.log(`\n🎉 Total items in DB: ${allItems?.length}`);
  console.table(allItems);
}

run();
