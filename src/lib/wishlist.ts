import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function wishlistQueryKey(userId: string | undefined) {
  return ["wishlist", userId];
}

function isMissingWishlistTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.message?.includes("public.wishlists") === true ||
    error.message?.includes("schema cache") === true
  );
}

export function useWishlist() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: wishlistQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId!);
      if (error && isMissingWishlistTable(error)) return new Set<string>();
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.product_id));
    },
    enabled: Boolean(userId),
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("Sign in to save pieces to your wishlist");
      const isSaved = query.data?.has(productId) ?? false;
      if (isSaved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);
        if (error && isMissingWishlistTable(error)) {
          throw new Error("Wishlist is not ready yet. Apply the latest Supabase migrations.");
        }
        if (error) throw error;
        return { added: false };
      }
      const { error } = await supabase
        .from("wishlists")
        .insert({ user_id: userId, product_id: productId });
      if (error && isMissingWishlistTable(error)) {
        throw new Error("Wishlist is not ready yet. Apply the latest Supabase migrations.");
      }
      if (error) throw error;
      return { added: true };
    },
    onSuccess: ({ added }) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKey(userId) });
      toast.success(added ? "Saved to your wishlist" : "Removed from your wishlist");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
  });

  return {
    productIds: query.data ?? new Set<string>(),
    isLoading: loading || (Boolean(userId) && (query.isLoading || query.isFetching)),
    isSaved: (productId: string) => query.data?.has(productId) ?? false,
    toggle: toggle.mutate,
    isToggling: toggle.isPending,
  };
}
