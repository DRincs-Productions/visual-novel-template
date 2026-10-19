import { SaveSlot } from "@/components/menus/save-menu/save-slots";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaveMenuPagination } from "@/lib/stores/save-menu-pagination-store";
import { quickSave } from "@/lib/utils/save-utility";
import { useSelector } from "@tanstack/react-store";

const TOTAL_PAGES = 10;
/** Number of save slots shown per page. */
const SAVES_PER_PAGE = 6;
const QUICK_SAVE_IDS = quickSave.getIds();

/** Number of consecutive page numbers shown around the current page on desktop. */
const DESKTOP_WINDOW_SIZE = 4;

type PageEntry = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(current: number, total: number): PageEntry[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(current - 1, total - DESKTOP_WINDOW_SIZE));
    const end = start + DESKTOP_WINDOW_SIZE - 1;

    const pages: PageEntry[] = [];
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("ellipsis-start");
    }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    if (end < total) {
        if (end < total - 1) pages.push("ellipsis-end");
        pages.push(total);
    }
    return pages;
}

export function GameSaveMenu({ quickSaves }: { quickSaves: boolean }) {
    const page = useSelector(SaveMenuPagination.store, (state) => state.page);

    const currentPage = page + 1;
    const pageNumbers = getPageNumbers(currentPage, TOTAL_PAGES);

    if (quickSaves) {
        return (
            <ScrollArea className="min-h-0 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {QUICK_SAVE_IDS.map((id) => (
                        <SaveSlot key={`SaveFile${id}`} saveId={id} />
                    ))}
                </div>
            </ScrollArea>
        );
    }

    return (
        <div className="flex flex-1 min-h-0 flex-col">
            <ScrollArea className="min-h-0 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {Array.from({ length: SAVES_PER_PAGE }).map((_, index) => {
                        const id = page * SAVES_PER_PAGE + index;
                        return <SaveSlot key={`SaveFile${id}`} saveId={id} />;
                    })}
                </div>
            </ScrollArea>
            <Pagination className="shrink-0 border-t py-1.5">
                <PaginationContent className="w-full justify-between px-2 sm:w-auto sm:justify-center sm:px-0">
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) SaveMenuPagination.setPage(page - 1);
                            }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                    <PaginationItem className="sm:hidden">
                        <span className="px-2 text-sm text-muted-foreground">
                            {currentPage} / {TOTAL_PAGES}
                        </span>
                    </PaginationItem>
                    {pageNumbers.map((p) =>
                        p === "ellipsis-start" || p === "ellipsis-end" ? (
                            <PaginationItem key={p} className="hidden sm:list-item">
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={p} className="hidden sm:list-item">
                                <PaginationLink
                                    isActive={p === currentPage}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        SaveMenuPagination.setPage((p as number) - 1);
                                    }}
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ),
                    )}
                    <PaginationItem>
                        <PaginationNext
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < TOTAL_PAGES) SaveMenuPagination.setPage(page + 1);
                            }}
                            aria-disabled={currentPage === TOTAL_PAGES}
                            className={
                                currentPage === TOTAL_PAGES ? "pointer-events-none opacity-50" : ""
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
