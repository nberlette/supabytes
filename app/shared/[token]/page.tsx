import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedFilePage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/s/${token}`);
}
