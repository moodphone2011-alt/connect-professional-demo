"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import type { KnowledgeDoc } from "@/lib/demo/types";
import { useDemoQuery } from "@/lib/hooks/use-demo-data";
import { employeesRepository, knowledgeRepository } from "@/lib/repositories";
import { formatDate } from "@/lib/utils/date";

export default function KnowledgePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <KnowledgeView />
    </Suspense>
  );
}

function KnowledgeView() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  // A `?doc=` link opens a document; an explicit choice overrides that default.
  const [choice, setChoice] = useState<{ doc: KnowledgeDoc | null } | null>(null);

  const { data, loading } = useDemoQuery(
    () => ({
      docs: knowledgeRepository.search(query, category),
      categories: ["All", ...knowledgeRepository.categories()],
      total: knowledgeRepository.list().length,
    }),
    [query, category],
  );

  const docParam = params.get("doc");
  const openDoc = choice
    ? choice.doc
    : docParam
      ? (knowledgeRepository.getById(docParam) ?? null)
      : null;
  const setOpenDoc = (doc: KnowledgeDoc | null) => setChoice({ doc });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Handbook"
        title="Company knowledge"
        description="Policies and procedures, searchable in full — so nobody has to ask HR what the rule is."
      />

      <Card className="space-y-4">
        <SearchInput
          label="Search company knowledge"
          value={query}
          onChange={setQuery}
          placeholder="Search policies, procedures and documents…"
        />
        {loading || !data ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <Tabs
            label="Category"
            value={category}
            onChange={setCategory}
            options={data.categories.map((value) => ({ value, label: value }))}
          />
        )}
      </Card>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : data.docs.length === 0 ? (
        <EmptyState
          title="No documents match"
          description={`Nothing in the handbook matches “${query.trim()}”. Try a broader term, or clear the filters.`}
          icon={<Icons.book className="size-5" />}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted">
            Showing {data.docs.length} of {data.total} documents
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.docs.map((doc) => (
              <Card key={doc.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 flex-none place-items-center rounded-lg bg-brand-500/10 text-brand-500">
                    <Icons.book className="size-4.5" />
                  </span>
                  <Badge tone="neutral">{doc.category}</Badge>
                </div>
                <h2 className="mt-3.5 text-base font-semibold text-ink">{doc.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{doc.summary}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                  <span className="text-xs text-muted">
                    Updated {formatDate(doc.updatedAt, true)}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => setOpenDoc(doc)}>
                    Read
                    <Icons.arrowRight className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(openDoc)}
        onClose={() => setOpenDoc(null)}
        title={openDoc?.title ?? ""}
        description={
          openDoc
            ? `${openDoc.category} · owned by ${employeesRepository.getById(openDoc.ownerId)?.name ?? "People & Culture"} · updated ${formatDate(openDoc.updatedAt, true)}`
            : undefined
        }
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setOpenDoc(null)}>
            Close
          </Button>
        }
      >
        {openDoc ? (
          <article className="space-y-5">
            <p className="text-sm leading-relaxed text-ink-soft">{openDoc.summary}</p>
            {openDoc.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="text-sm font-semibold text-ink">{section.heading}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.body}</p>
              </section>
            ))}
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-4">
              {openDoc.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  #{tag}
                </Badge>
              ))}
            </div>
          </article>
        ) : null}
      </Modal>
    </div>
  );
}
