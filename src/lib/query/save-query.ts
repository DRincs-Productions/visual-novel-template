import { save } from "@/lib/utils/save-utility";
import { useQuery } from "@tanstack/react-query";

export const SAVES_USE_QUERY_KEY = "saves_use_query_key";
export function useQuerySaves({ id }: { id: number }) {
    return useQuery({
        queryKey: [SAVES_USE_QUERY_KEY, id],
        queryFn: async () => (await save.get(id)) || null,
    });
}

export const LAST_SAVE_USE_QUERY_KEY = "last_save_use_query_key";
export function useQueryLastSave() {
    return useQuery({
        queryKey: [LAST_SAVE_USE_QUERY_KEY],
        queryFn: async () => (await save.getLast()) || null,
    });
}
