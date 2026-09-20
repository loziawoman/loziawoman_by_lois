import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { products as catalogProducts, naira } from "@/data/products";
import { CMS_CHANGE_EVENT, CMS_STORAGE_KEY } from "@/hooks/use-cms";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Minus,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

export type HomepageContent = {
  eyebrow: string;
  headline: string;
  italicHeadline: string;
  description: string;
  ctaLabel: string;
  announcement: string;
};

export type PolicySection = { title: string; body: string };
export type Policy = {
  id: "shipping" | "returns" | "privacy";
  name: string;
  intro: string;
  sections: PolicySection[];
};

export type StudioSettings = {
  email: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  city: string;
  hours: string;
  instagram: string;
  footerLine: string;
};

export type SavedChange = { id: string; label: string; savedAt: string };
export type AdminWorkspace = {
  products: Product[];
  homepage: HomepageContent;
  policies: Policy[];
  settings: StudioSettings;
  changes: SavedChange[];
};

export type ProductDraft = {
  name: string;
  slug: string;
  description: string;
  price: string;
  category: string;
  fabric: string;
  care: string;
  imageUrl: string;
  featured: boolean;
  newArrival: boolean;
};

const defaultHomepage: HomepageContent = {
  eyebrow: "LOZIA / Collection 01",
  headline: "Defined by",
  italicHeadline: "elegance.",
  description: "Contemporary pieces for the woman who knows that presence does not need to be loud.",
  ctaLabel: "Shop the collection",
  announcement: "",
};

const defaultPolicies: Policy[] = [
  {
    id: "shipping",
    name: "Shipping",
    intro: "Every LOZIA order is wrapped at the Lagos studio and sent with care. We will share delivery updates as soon as your order is on its way.",
    sections: [
      { title: "Delivery windows", body: "Lagos deliveries usually arrive within 2–5 working days. Deliveries to other Nigerian cities usually take 3–7 working days. International orders generally arrive within 5–10 working days, depending on destination and customs." },
      { title: "Fees and tracking", body: "Delivery fees are calculated at checkout based on your destination. Once your parcel leaves the studio, our team will send the available tracking or courier details to the email or phone number on the order." },
      { title: "A small studio note", body: "Orders are checked and packed by hand. If your delivery address changes, message the studio as quickly as possible on WhatsApp before the parcel has been dispatched." },
    ],
  },
  {
    id: "returns",
    name: "Returns",
    intro: "If a piece is not quite right, contact the studio within 7 days of delivery. We will help you work through the next step.",
    sections: [
      { title: "Eligibility", body: "Items must be unworn, unwashed, undamaged and returned with their original tags and packaging. Please check your order as soon as it arrives and keep the piece protected while a return is arranged." },
      { title: "How to start", body: "Send your order number, the piece you would like to return and a short reason to hello@lozia.studio or WhatsApp. We will confirm the return address and the available resolution before you send anything back." },
      { title: "Exceptions", body: "For hygiene and production reasons, altered, personalised, worn, washed or final-sale pieces cannot be returned. Return delivery is the customer’s responsibility unless the item arrived damaged or incorrect." },
    ],
  },
  {
    id: "privacy",
    name: "Privacy",
    intro: "Your details stay between you and LOZIA. We only use the information needed to fulfil your order, answer your questions and keep the studio running.",
    sections: [
      { title: "What we collect", body: "When you place an order or contact us, we may receive your name, delivery details, email address, phone number and the information needed to help with your request." },
      { title: "How we use it", body: "We use these details to confirm orders, arrange delivery, respond to messages, handle returns and improve the shopping experience. We do not sell your personal information." },
      { title: "Your choices", body: "You can ask what personal information we hold, request a correction or ask us to stop using it where there is no legal or fulfilment reason to keep it. Write to hello@lozia.studio and we will help." },
    ],
  },
];

const defaultSettings: StudioSettings = {
  email: "hello@lozia.studio",
  whatsappDisplay: "+234 000 000 0000",
  whatsappUrl: "https://wa.me/2340000000000?text=Hello%20LOZIA%20studio%2C%20I%27d%20like%20to%20ask%20about%20a%20piece.",
  city: "Lagos, Nigeria",
  hours: "Mon–Fri, 10:00–17:00",
  instagram: "@lozia.studio",
  footerLine: "© 2025 LOZIA Studio · Lagos, Nigeria",
};

const makeDefaultWorkspace = (): AdminWorkspace => ({
  products: catalogProducts.map((product) => ({ ...product, images: [...product.images] })),
  homepage: defaultHomepage,
  policies: defaultPolicies,
  settings: defaultSettings,
  changes: [],
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const makeDraft = (product?: Product): ProductDraft => ({
  name: product?.name ?? "",
  slug: product?.slug ?? "",
  description: product?.description ?? "",
  price: String(product?.price ?? ""),
  category: product?.category ?? "Dresses",
  fabric: product?.fabric ?? "",
  care: product?.care ?? "",
  imageUrl: product?.images?.[0] ?? "",
  featured: Boolean(product?.featured),
  newArrival: Boolean(product?.newArrival),
});

const buildProduct = (draft: ProductDraft, existing?: Product): Product => {
  const id = existing?.id ?? `${slugify(draft.name) || "new-piece"}-${Date.now().toString(36)}`;
  return {
    ...(existing ?? {
      id,
      colours: [{ name: "Espresso", hex: "#3a2820" }],
      sizes: ["XS", "S", "M", "L", "XL"],
      variants: [],
      originalColor: "Espresso",
    }),
    id,
    name: draft.name.trim() || "Untitled piece",
    slug: slugify(draft.slug || draft.name) || id,
    description: draft.description.trim(),
    price: Number(draft.price) || 0,
    category: draft.category.trim() || "Uncategorised",
    fabric: draft.fabric.trim(),
    care: draft.care.trim(),
    images: draft.imageUrl.trim() ? [draft.imageUrl.trim()] : [],
    featured: draft.featured,
    newArrival: draft.newArrival,
  };
};

const formatSavedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  hint,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  hint?: string;
  testId: string;
}) {
  const common =
    "mt-2 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]";
  return (
    <label className="block">
      <span className="mono text-[hsl(var(--muted-foreground))]">{label}</span>
      {multiline ? (
        <textarea
          data-testid={testId}
          className={`${common} min-h-[104px] resize-y leading-relaxed`}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          data-testid={testId}
          className={common}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">{hint}</span> : null}
    </label>
  );
}

function SaveButton({ label = "Save changes", onClick, saving = false }: { label?: string; onClick: () => void; saving?: boolean }) {
  return (
    <button
      type="button"
      data-testid="button-save-changes"
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
    >
      {saving ? <Clock3 size={14} className="animate-pulse" /> : <Save size={14} />}
      {saving ? "Saving" : label}
    </button>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-7 max-w-2xl reveal">
      <p className="mono mb-3 text-[hsl(var(--accent))]">{eyebrow}</p>
      <h1 className="serif text-4xl leading-[1.05] text-[hsl(var(--foreground))] md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
    </header>
  );
}

export function AdminPage() {
  const [workspace, setWorkspace] = useState<AdminWorkspace>(() => makeDefaultWorkspace());
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(() => makeDraft());
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "featured" | "new">("all");
  const [saving, setSaving] = useState(false);
  const [homepageDraft, setHomepageDraft] = useState(defaultHomepage);
  const [policiesDraft, setPoliciesDraft] = useState(defaultPolicies);
  const [settingsDraft, setSettingsDraft] = useState(defaultSettings);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AdminWorkspace>;
        const initial = makeDefaultWorkspace();
        setWorkspace({
          products: Array.isArray(parsed.products) ? parsed.products : initial.products,
          homepage: { ...initial.homepage, ...(parsed.homepage ?? {}) },
          policies: Array.isArray(parsed.policies) ? parsed.policies : initial.policies,
          settings: { ...initial.settings, ...(parsed.settings ?? {}) },
          changes: Array.isArray(parsed.changes) ? parsed.changes : [],
        });
        setHomepageDraft({ ...initial.homepage, ...(parsed.homepage ?? {}) });
        setPoliciesDraft(Array.isArray(parsed.policies) ? parsed.policies : initial.policies);
        setSettingsDraft({ ...initial.settings, ...(parsed.settings ?? {}) });
      }
    } catch {
      setNotice("We could not read saved studio data. Showing the catalogue defaults.");
    } finally {
      setHydrated(true);
    }
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const persist = (updater: (current: AdminWorkspace) => AdminWorkspace, label: string) => {
    setSaving(true);
    window.setTimeout(() => {
      setWorkspace((current) => {
        const change: SavedChange = { id: `${Date.now()}`, label, savedAt: new Date().toISOString() };
        const next = updater(current);
        const complete = { ...next, changes: [change, ...next.changes].slice(0, 12) };
        window.localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(complete));
        window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
        return complete;
      });
      setSaving(false);
      flash(`${label} saved`);
    }, 180);
  };

  const selectSection = (section: string) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    setNotice("");
  };

  const openNewProduct = () => {
    setSelectedProductId(null);
    setProductDraft(makeDraft());
    selectSection("products");
  };

  const openProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setProductDraft(makeDraft(product));
    selectSection("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = () => {
    const product = buildProduct(productDraft, workspace.products.find((item) => item.id === selectedProductId));
    persist(
      (current) => ({
        ...current,
        products: selectedProductId
          ? current.products.map((item) => (item.id === selectedProductId ? product : item))
          : [product, ...current.products],
      }),
      selectedProductId ? `${product.name} updated` : `${product.name} added`,
    );
    setSelectedProductId(product.id);
  };

  const deleteProduct = (product: Product) => {
    if (!window.confirm(`Remove ${product.name} from the catalogue?`)) return;
    persist(
      (current) => ({ ...current, products: current.products.filter((item) => item.id !== product.id) }),
      `${product.name} removed`,
    );
    if (selectedProductId === product.id) {
      setSelectedProductId(null);
      setProductDraft(makeDraft());
    }
  };

  const toggleProductFlag = (product: Product, field: "featured" | "newArrival") => {
    const next = { ...product, [field]: !product[field] };
    persist(
      (current) => ({ ...current, products: current.products.map((item) => (item.id === product.id ? next : item)) }),
      `${product.name} ${field === "featured" ? "featured status" : "new arrival status"} updated`,
    );
  };

  const filteredProducts = useMemo(() => {
    const query = productQuery.toLowerCase().trim();
    return workspace.products.filter((product) => {
      const matchesQuery = !query || `${product.name} ${product.category} ${product.slug}`.toLowerCase().includes(query);
      const matchesFilter = productFilter === "all" || (productFilter === "featured" ? product.featured : product.newArrival);
      return matchesQuery && matchesFilter;
    });
  }, [productFilter, productQuery, workspace.products]);

  const renderOverview = () => (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="LOZIA / Studio desk"
        title="A quiet place to keep the shop considered."
        description="Shape the catalogue, homepage and details behind the LOZIA world. Your changes stay in this browser until you are ready to publish them."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pieces in catalogue", value: workspace.products.length, icon: ShoppingBag, accent: "text-[hsl(var(--foreground))]" },
          { label: "Featured pieces", value: workspace.products.filter((product) => product.featured).length, icon: Sparkles, accent: "text-[hsl(var(--accent))]" },
          { label: "Policy pages", value: workspace.policies.length, icon: FileText, accent: "text-[hsl(var(--foreground))]" },
          { label: "New arrivals", value: workspace.products.filter((product) => product.newArrival).length, icon: Archive, accent: "text-[hsl(var(--accent))]" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} data-testid={`card-stat-${stat.label.toLowerCase().replaceAll(" ", "-")}`} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-0.5">
              <Icon size={17} className={stat.accent} strokeWidth={1.5} />
              <p className="mt-8 text-3xl text-[hsl(var(--foreground))]">{stat.value}</p>
              <p className="mono mt-2 text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
            <div>
              <p className="mono text-[hsl(var(--accent))]">Recent activity</p>
              <h2 className="serif mt-1 text-2xl">The studio log</h2>
            </div>
            <Clock3 size={17} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          {workspace.changes.length ? (
            <div className="divide-y divide-[hsl(var(--border))]">
              {workspace.changes.slice(0, 6).map((change) => (
                <div key={change.id} data-testid={`text-change-${change.id}`} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--accent))]"><Check size={13} /></span>
                    <span className="truncate text-sm">{change.label}</span>
                  </div>
                  <span className="mono shrink-0 text-[hsl(var(--muted-foreground))]">{formatSavedAt(change.savedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="serif text-2xl">No edits yet.</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Your saved studio changes will appear here.</p>
            </div>
          )}
        </div>
        <div className="relative overflow-hidden bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-[hsl(var(--secondary)/.35)]" />
          <div className="absolute -bottom-14 -right-4 h-44 w-44 rounded-full border border-[hsl(var(--secondary)/.25)]" />
          <p className="mono text-[hsl(var(--secondary))]">Homepage at a glance</p>
          <h2 className="serif mt-8 max-w-xs text-3xl leading-tight">{workspace.homepage.headline}</h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[hsl(var(--primary-foreground)/.7)]">{workspace.homepage.description}</p>
          <button type="button" data-testid="button-edit-homepage-overview" onClick={() => selectSection("homepage")} className="mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[.14em] text-[hsl(var(--secondary))] underline decoration-[hsl(var(--secondary)/.5)] underline-offset-4">
            Edit homepage <ArrowLeft size={13} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => {
    const editing = Boolean(selectedProductId);
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Catalogue / Products"
          title={editing ? "Refine the piece." : "The collection, in full."}
          description={editing ? "Keep the details exact. These fields shape how a piece is discovered and understood." : "Add, edit and quietly curate every piece shown in the LOZIA collection."}
        />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 border-b border-[hsl(var(--border))] pb-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xs">
                <Search size={15} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
                <input data-testid="input-search-products" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Find a piece..." className="w-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--accent))]" />
              </div>
              <div className="flex items-center gap-1">
                {(["all", "featured", "new"] as const).map((filter) => (
                  <button type="button" data-testid={`button-filter-${filter}`} key={filter} onClick={() => setProductFilter(filter)} className={`px-3 py-2 text-[10px] uppercase tracking-[.13em] transition-colors ${productFilter === filter ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                    {filter === "new" ? "New arrivals" : filter}
                  </button>
                ))}
              </div>
            </div>
            {filteredProducts.length ? (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} data-testid={`row-product-${product.id}`} className={`group flex items-center gap-3 border bg-[hsl(var(--card))] p-2.5 transition-colors ${selectedProductId === product.id ? "border-[hsl(var(--accent))]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--accent)/.6)]"}`}>
                    <div className="h-[72px] w-[58px] shrink-0 overflow-hidden bg-[hsl(var(--muted))]">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="image-hover h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon size={17} className="text-[hsl(var(--muted-foreground))]" /></div>}
                    </div>
                    <button type="button" data-testid={`button-select-product-${product.id}`} onClick={() => openProduct(product)} className="min-w-0 flex-1 text-left">
                      <span className="serif block truncate text-xl">{product.name}</span>
                      <span className="mono mt-1 block text-[hsl(var(--muted-foreground))]">{product.category} · {naira(product.price)}</span>
                    </button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {product.featured ? <span className="mono border border-[hsl(var(--accent)/.5)] px-2 py-1 text-[hsl(var(--accent))]">Featured</span> : null}
                      {product.newArrival ? <span className="mono border border-[hsl(var(--border))] px-2 py-1 text-[hsl(var(--muted-foreground))]">New</span> : null}
                    </div>
                    <button type="button" data-testid={`button-edit-product-${product.id}`} aria-label={`Edit ${product.name}`} onClick={() => openProduct(product)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><Pencil size={15} /></button>
                    <button type="button" data-testid={`button-delete-product-${product.id}`} aria-label={`Delete ${product.name}`} onClick={() => deleteProduct(product)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[hsl(var(--border))] px-5 py-16 text-center">
                <Package size={22} className="mx-auto text-[hsl(var(--muted-foreground))]" />
                <p className="serif mt-4 text-2xl">Nothing in this view.</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Try another search or add a new piece.</p>
              </div>
            )}
            <button type="button" data-testid="button-add-product" onClick={openNewProduct} className="mt-4 inline-flex items-center gap-2 border border-dashed border-[hsl(var(--accent)/.7)] px-4 py-3 text-xs uppercase tracking-[.13em] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/.06)]"><Plus size={15} /> Add a piece</button>
          </div>
          <div className="h-fit border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
              <div><p className="mono text-[hsl(var(--accent))]">{editing ? "Editing piece" : "New piece"}</p><h2 className="serif mt-1 text-2xl">{editing ? productDraft.name || "Untitled" : "Add to catalogue"}</h2></div>
              {editing ? <button type="button" data-testid="button-close-product-editor" onClick={() => { setSelectedProductId(null); setProductDraft(makeDraft()); }} className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X size={16} /></button> : null}
            </div>
            <div className="space-y-4 p-5">
              <Field label="Name" value={productDraft.name} onChange={(value) => setProductDraft((draft) => ({ ...draft, name: value }))} placeholder="The name of the piece" testId="input-product-name" />
              <Field label="Slug" value={productDraft.slug} onChange={(value) => setProductDraft((draft) => ({ ...draft, slug: value }))} placeholder="the-piece-slug" hint="Use lowercase words separated by hyphens." testId="input-product-slug" />
              <Field label="Description" value={productDraft.description} onChange={(value) => setProductDraft((draft) => ({ ...draft, description: value }))} multiline placeholder="What should the wearer know?" testId="input-product-description" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (NGN)" type="number" value={productDraft.price} onChange={(value) => setProductDraft((draft) => ({ ...draft, price: value }))} placeholder="85000" testId="input-product-price" />
                <label className="block"><span className="mono text-[hsl(var(--muted-foreground))]">Category</span><select data-testid="select-product-category" value={productDraft.category} onChange={(event) => setProductDraft((draft) => ({ ...draft, category: event.target.value }))} className="mt-2 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--accent))]"><option>Dresses</option><option>Tailoring</option><option>Sets</option><option>Bottoms</option><option>Tops</option><option>Accessories</option></select></label>
              </div>
              <Field label="Fabric" value={productDraft.fabric} onChange={(value) => setProductDraft((draft) => ({ ...draft, fabric: value }))} placeholder="Fluid crepe" testId="input-product-fabric" />
              <Field label="Care" value={productDraft.care} onChange={(value) => setProductDraft((draft) => ({ ...draft, care: value }))} placeholder="Dry clean only" testId="input-product-care" />
              <Field label="Image URL" value={productDraft.imageUrl} onChange={(value) => setProductDraft((draft) => ({ ...draft, imageUrl: value }))} placeholder="/images/your-piece.jpg" hint="Use a path from the storefront or a hosted image URL." testId="input-product-image-url" />
              <div className="grid gap-2 border-t border-[hsl(var(--border))] pt-4 sm:grid-cols-2">
                {([["featured", "Featured piece"], ["newArrival", "New arrival"]] as const).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-3 py-1 text-sm">
                    <input data-testid={`checkbox-product-${key}`} type="checkbox" checked={productDraft[key]} onChange={(event) => setProductDraft((draft) => ({ ...draft, [key]: event.target.checked }))} className="h-4 w-4 accent-[hsl(var(--accent))]" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-5">
                {editing ? <button type="button" data-testid="button-reset-product" onClick={() => { const product = workspace.products.find((item) => item.id === selectedProductId); if (product) setProductDraft(makeDraft(product)); }} className="text-xs uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Reset</button> : <span />}
                <SaveButton label={editing ? "Save piece" : "Add piece"} onClick={saveProduct} saving={saving} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHomepage = () => (
    <div className="space-y-8">
      <SectionHeader eyebrow="Editorial / Homepage" title="Set the first impression." description="The opening words of LOZIA should feel like an invitation, not an announcement. Keep them precise." />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Hero eyebrow" value={homepageDraft.eyebrow} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, eyebrow: value }))} testId="input-homepage-eyebrow" />
            <Field label="CTA label" value={homepageDraft.ctaLabel} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, ctaLabel: value }))} testId="input-homepage-cta" />
          </div>
          <Field label="Headline" value={homepageDraft.headline} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, headline: value }))} hint="The upright line of the hero statement." testId="input-homepage-headline" />
          <Field label="Italic headline" value={homepageDraft.italicHeadline} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, italicHeadline: value }))} hint="The softer, italic line that follows." testId="input-homepage-italic-headline" />
          <Field label="Description" value={homepageDraft.description} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, description: value }))} multiline testId="input-homepage-description" />
          <Field label="Announcement text" value={homepageDraft.announcement} onChange={(value) => setHomepageDraft((draft) => ({ ...draft, announcement: value }))} testId="input-homepage-announcement" />
          <div className="flex justify-end border-t border-[hsl(var(--border))] pt-5"><SaveButton onClick={() => persist((current) => ({ ...current, homepage: homepageDraft }), "Homepage content")} saving={saving} /></div>
        </div>
        <div className="h-fit bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]">
          <p className="mono text-[hsl(var(--secondary))]">Live copy preview</p>
          <p className="mono mt-10 text-[hsl(var(--secondary))]">{homepageDraft.eyebrow || "Your eyebrow"}</p>
          <h2 className="serif mt-3 text-4xl leading-[1.04]">{homepageDraft.headline || "Your headline"}</h2>
          <h3 className="serif mt-1 text-3xl italic text-[hsl(var(--secondary))]">{homepageDraft.italicHeadline || "Your italic headline"}</h3>
          <p className="mt-5 text-sm leading-6 text-[hsl(var(--primary-foreground)/.72)]">{homepageDraft.description || "Your description will sit here."}</p>
          <div className="mt-8 inline-flex border-b border-[hsl(var(--secondary)/.7)] pb-1 text-xs uppercase tracking-[.14em] text-[hsl(var(--secondary))]">{homepageDraft.ctaLabel || "Your CTA"}</div>
        </div>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-8">
      <SectionHeader eyebrow="Details / Policies" title="The practical poetry of care." description="Make the essentials easy to find and easy to understand. Keep the tone warm, direct and distinctly LOZIA." />
      <div className="space-y-5">
        {policiesDraft.map((policy, policyIndex) => (
          <article key={policy.id} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-5 py-4"><span className="mono text-[hsl(var(--accent))]">0{policyIndex + 1}</span><h2 className="serif text-2xl">{policy.name}</h2></div>
            <div className="space-y-5 p-5 md:p-7">
              <Field label="Introduction" value={policy.intro} multiline onChange={(value) => setPoliciesDraft((draft) => draft.map((item) => item.id === policy.id ? { ...item, intro: value } : item))} testId={`input-policy-intro-${policy.id}`} />
              <div className="space-y-4">
                {policy.sections.map((section, sectionIndex) => (
                  <div key={`${policy.id}-${sectionIndex}`} className="grid gap-3 border-l-2 border-[hsl(var(--secondary))] pl-4 md:grid-cols-[.7fr_1.3fr_auto] md:items-start">
                    <Field label={`Section ${sectionIndex + 1} title`} value={section.title} onChange={(value) => setPoliciesDraft((draft) => draft.map((item) => item.id === policy.id ? { ...item, sections: item.sections.map((part, index) => index === sectionIndex ? { ...part, title: value } : part) } : item))} testId={`input-policy-title-${policy.id}-${sectionIndex}`} />
                    <Field label="Body" value={section.body} multiline onChange={(value) => setPoliciesDraft((draft) => draft.map((item) => item.id === policy.id ? { ...item, sections: item.sections.map((part, index) => index === sectionIndex ? { ...part, body: value } : part) } : item))} testId={`input-policy-body-${policy.id}-${sectionIndex}`} />
                    <button type="button" data-testid={`button-remove-policy-section-${policy.id}-${sectionIndex}`} aria-label={`Remove ${policy.name} section ${sectionIndex + 1}`} onClick={() => setPoliciesDraft((draft) => draft.map((item) => item.id === policy.id ? { ...item, sections: item.sections.filter((_, index) => index !== sectionIndex) } : item))} className="mt-7 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Minus size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" data-testid={`button-add-policy-section-${policy.id}`} onClick={() => setPoliciesDraft((draft) => draft.map((item) => item.id === policy.id ? { ...item, sections: [...item.sections, { title: "", body: "" }] } : item))} className="inline-flex items-center gap-2 text-xs uppercase tracking-[.13em] text-[hsl(var(--accent))]"><Plus size={14} /> Add section</button>
            </div>
          </article>
        ))}
      </div>
      <div className="flex justify-end"><SaveButton onClick={() => persist((current) => ({ ...current, policies: policiesDraft }), "Policy pages")} saving={saving} /></div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <SectionHeader eyebrow="The studio / Settings" title="Keep the door open." description="The details that help someone find, contact and remember the studio." />
      <div className="max-w-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Studio email" type="email" value={settingsDraft.email} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, email: value }))} testId="input-settings-email" />
          <Field label="WhatsApp display number" value={settingsDraft.whatsappDisplay} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, whatsappDisplay: value }))} testId="input-settings-whatsapp-display" />
          <Field label="WhatsApp URL" value={settingsDraft.whatsappUrl} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, whatsappUrl: value }))} hint="Include the full https://wa.me link." testId="input-settings-whatsapp-url" />
          <Field label="Instagram" value={settingsDraft.instagram} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, instagram: value }))} placeholder="@lozia.studio" testId="input-settings-instagram" />
          <Field label="City" value={settingsDraft.city} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, city: value }))} testId="input-settings-city" />
          <Field label="Opening hours" value={settingsDraft.hours} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, hours: value }))} testId="input-settings-hours" />
        </div>
        <div className="mt-5"><Field label="Footer line" value={settingsDraft.footerLine} onChange={(value) => setSettingsDraft((draft) => ({ ...draft, footerLine: value }))} testId="input-settings-footer-line" /></div>
        <div className="mt-6 flex justify-end border-t border-[hsl(var(--border))] pt-5"><SaveButton onClick={() => persist((current) => ({ ...current, settings: settingsDraft }), "Studio settings")} saving={saving} /></div>
      </div>
      <div className="flex gap-3 border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] p-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        <CircleHelp size={17} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" />
        <p>These details appear across the storefront footer and contact points. Use a complete WhatsApp URL so visitors can start a conversation in one tap.</p>
      </div>
    </div>
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "homepage", label: "Homepage content", icon: Sparkles },
    { id: "policies", label: "Policies", icon: FileText },
    { id: "settings", label: "Studio settings", icon: Settings2 },
  ];

  if (!hydrated) {
    return (
      <div className="grain min-h-[100dvh] bg-[hsl(var(--background))] p-6">
        <div className="mx-auto max-w-[1480px] animate-pulse">
          <div className="h-8 w-36 bg-[hsl(var(--muted))]" />
          <div className="mt-14 h-12 w-80 bg-[hsl(var(--muted))]" />
          <div className="mt-8 h-48 bg-[hsl(var(--muted))]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grain min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-5">
            <button type="button" data-testid="button-mobile-nav" onClick={() => setMobileNavOpen((open) => !open)} className="p-1 md:hidden"><Menu size={20} /></button>
            <div>
              <p className="serif text-[26px] leading-none tracking-[-.04em]">LOZIA</p>
              <p className="mono mt-1 text-[hsl(var(--muted-foreground))]">Studio desk</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" /> Local workspace</span>
            <a data-testid="link-view-storefront" href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-l border-[hsl(var(--border))] pl-4 text-xs uppercase tracking-[.13em] hover:text-[hsl(var(--accent))]">View shop <ExternalLink size={13} /></a>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1480px]">
        <aside className={`fixed inset-x-0 top-[72px] z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 md:sticky md:top-[72px] md:block md:h-[calc(100dvh-72px)] md:w-[240px] md:shrink-0 md:border-b-0 md:border-r md:bg-transparent md:p-6 ${mobileNavOpen ? "block" : "hidden"}`}>
          <nav aria-label="Studio sections" className="space-y-1">
            <p className="mono mb-4 px-3 text-[hsl(var(--muted-foreground))]">Workspace</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button type="button" data-testid={`button-nav-${item.id}`} key={item.id} onClick={() => selectSection(item.id)} className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${activeSection === item.id ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/.65)] hover:text-[hsl(var(--foreground))]"}`}>
                  <span className="flex items-center gap-3"><Icon size={16} strokeWidth={1.5} />{item.label}</span>
                  {activeSection === item.id ? <ChevronRight size={14} /> : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-12 hidden border-t border-[hsl(var(--border))] pt-5 md:block">
            <p className="mono text-[hsl(var(--muted-foreground))]">Saved locally</p>
            <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your edits are stored in this browser. A future publish step can take them live.</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-10 md:px-10 md:py-14 lg:px-16">
          {notice ? <div data-testid="status-save-confirmation" role="status" className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-40px)] items-center gap-3 border border-[hsl(var(--accent)/.5)] bg-[hsl(var(--primary))] px-4 py-3 text-sm text-[hsl(var(--primary-foreground))] shadow-lg"><Check size={16} className="text-[hsl(var(--secondary))]" />{notice}</div> : null}
          {activeSection === "overview" ? renderOverview() : null}
          {activeSection === "products" ? renderProducts() : null}
          {activeSection === "homepage" ? renderHomepage() : null}
          {activeSection === "policies" ? renderPolicies() : null}
          {activeSection === "settings" ? renderSettings() : null}
          <footer className="mt-20 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="mono">LOZIA / Studio desk</span>
              <span>Local content workspace · {workspace.products.length} pieces</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;