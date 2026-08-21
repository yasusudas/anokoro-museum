export type ExhibitItem = {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  category: string;
  year: string;
  description: string;
  imageUrl?: string | null;
  theme: string;
  shinmiriCount: number;
  userName?: string;
  createdAt: string;
};
