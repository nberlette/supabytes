import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: preferences } = await supabase.from("user_preferences").select(
    "*",
  ).eq("user_id", user.id).single();

  const { data: storageData } = await supabase
    .from("files")
    .select("size")
    .eq("user_id", user.id)
    .eq("is_trashed", false);

  const totalUsed =
    storageData?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
        <SettingsForm
          userId={user.id}
          userEmail={user.email || ""}
          preferences={preferences}
          storageUsed={totalUsed}
        />
      </div>
    </div>
  );
}
