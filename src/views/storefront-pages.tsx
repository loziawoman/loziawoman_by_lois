'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Heart, MessageCircle, Plus, Search, Truck, X } from 'lucide-react';
import { GarmentColorizer } from '@/components/garment-colorizer';
import { LoziaImage } from '@/components/lozia-image';
import { naira, type Product } from '@/data/products';
import { useBag } from '@/hooks/use-store';
import { useCmsWorkspace } from '@/hooks/use-cms';

const ProductCard = ({ product, onQuickAdd }: { product: Product; onQuickAdd?: (product: Product) => void }) => <Link href={`/shop/${product.slug}`} className="group block" data-testid={`card-product-${product.id}`}><div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--muted))]"><LoziaImage src={product.images[0]} alt={product.name} fill sizes="(min-width: 768px) 33vw, 50vw" className="image-hover object-cover" />{product.newArrival && <span className="absolute left-3 top-3 bg-[hsl(var(--card))] px-2 py-1 mono text-[9px]">New arrival</span>}<button onClick={(e) => { e.preventDefault(); onQuickAdd?.(product); }} className="absolute bottom-3 right-3 translate-y-3 bg-[hsl(var(--card))] px-3 py-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 mono" data-testid={`button-quick-add-${product.id}`}>Quick add</button></div><div className="flex justify-between gap-2 pt-4"><div><p className="serif text-[19px]">{product.name}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{product.category}</p></div><p className="text-sm">{naira(product.price)}</p></div></Link>;

export function HomePage() {
  const { products, homepage } = useCmsWorkspace();
  const featured = products.filter((p) => p.featured);

  return <div>
    {homepage.announcement && <div className="bg-[hsl(var(--accent))] px-5 py-2 text-center text-xs text-[hsl(var(--accent-foreground))]">{homepage.announcement}</div>}

    <section className="relative min-h-[calc(100dvh-74px)] overflow-hidden bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,hsl(var(--accent))/18%,transparent_42%)]" />
      <div className="absolute right-[-18%] top-[8%] h-[86vw] max-h-[680px] w-[86vw] max-w-[680px] overflow-hidden rounded-full border border-[hsl(var(--secondary))]/35 shadow-2xl md:right-[5%] md:top-[9%]">
        <LoziaImage src="/images/lozia-logo.jpeg" alt="LOZIA logo" fill sizes="(min-width: 768px) 680px, 86vw" loading="eager" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/80 via-transparent to-transparent md:from-[hsl(var(--primary))]/35" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary))]/70 to-transparent" />
      <div className="relative mx-auto flex min-h-[calc(100dvh-74px)] max-w-[1440px] items-end px-5 pb-16 md:items-center md:px-16 md:pb-0">
        <div className="max-w-[700px] reveal">
          <span className="mono text-[hsl(var(--secondary))]">{homepage.eyebrow}</span>
          <h1 className="serif mt-5 text-[clamp(3.8rem,9vw,8.8rem)] leading-[.88] tracking-[-.05em]">{homepage.headline}<br /><i>{homepage.italicHeadline}</i></h1>
          <p className="mt-8 max-w-[380px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">{homepage.description}</p>
          <Link href="/shop" className="mt-9 inline-flex items-center gap-4 border border-[hsl(var(--secondary))] px-6 py-4 mono text-[hsl(var(--secondary))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))]" data-testid="link-hero-shop">{homepage.ctaLabel} <ArrowRight size={15}/></Link>
        </div>
        <div className="absolute bottom-10 right-12 hidden text-right md:block">
          <span className="mono text-[hsl(var(--primary-foreground))]/45">A distinctive<br />expression of self</span>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="flex items-end justify-between">
        <div>
          <span className="mono text-[hsl(var(--accent))]">The collection</span>
          <h2 className="serif mt-3 text-5xl md:text-7xl">Quiet confidence,<br /><i>cut into form.</i></h2>
          <p className="mt-5 max-w-[480px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">LOZIA brings together refined silhouettes, considered details and pieces made to move with the woman wearing them.</p>
        </div>
        <Link href="/shop" className="hidden items-center gap-2 mono md:flex underline-link" data-testid="link-view-all">View all <ArrowRight size={14}/></Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <Link href="/shop" className="mt-8 flex items-center gap-2 mono md:hidden underline-link" data-testid="mobile-link-view-all">View all <ArrowRight size={14}/></Link>
    </section>

    <section className="mx-auto grid max-w-[1440px] gap-4 px-5 pb-20 md:grid-cols-3 md:px-10">
      <Link href="/shop?category=Tailoring" className="group relative min-h-[360px] overflow-hidden bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <LoziaImage src="/images/lozia-blazer.jpg" alt="Tailoring — The Corporate Edit" fill sizes="(min-width: 768px) 33vw, 100vw" className="image-hover object-cover opacity-45" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end p-7">
          <span className="mono text-[hsl(var(--secondary))]">Tailoring</span>
          <h3 className="serif mt-2 text-4xl">The Corporate Edit</h3>
        </div>
      </Link>

      <Link href="/shop?category=Sets" className="group relative min-h-[360px] overflow-hidden bg-[hsl(var(--accent))] text-[hsl(var(--primary))]">
        <LoziaImage src="/images/atelier-set.jpg" alt="Everyday — Pieces with presence" fill sizes="(min-width: 768px) 33vw, 100vw" className="image-hover object-cover opacity-55" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end p-7">
          <span className="mono">Everyday</span>
          <h3 className="serif mt-2 text-4xl">Pieces with presence</h3>
        </div>
      </Link>

      <Link href="/shop?category=Dresses" className="group relative min-h-[360px] overflow-hidden bg-[hsl(var(--muted))]">
        <LoziaImage src="/images/muse-dress.jpg" alt="Evening — After hours" fill sizes="(min-width: 768px) 33vw, 100vw" className="image-hover object-cover" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end bg-gradient-to-t from-black/55 to-transparent p-7 text-white">
          <span className="mono text-[hsl(var(--secondary))]">Evening</span>
          <h3 className="serif mt-2 text-4xl">After hours</h3>
        </div>
      </Link>
    </section>

    <section className="grid min-h-[650px] md:grid-cols-2">
      <div className="flex items-center bg-[hsl(var(--accent))] px-8 py-20 text-[hsl(var(--primary))] md:px-20">
        <div className="max-w-[470px]">
          <span className="mono">The LOZIA woman</span>
          <blockquote className="serif mt-7 text-5xl leading-[1.05] md:text-7xl">“She does not dress for attention. She dresses because expression is part of who she is.”</blockquote>
          <Link href="/about" className="mt-8 inline-flex items-center gap-3 border-b border-current pb-2 mono" data-testid="link-about-story">Discover LOZIA <ArrowRight size={14}/></Link>
        </div>
      </div>

      <div className="relative min-h-[500px] overflow-hidden bg-[hsl(var(--muted))]">
        <LoziaImage src="/images/atelier-set.jpg" alt="The Atelier Set editorial" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover image-hover" />
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="flex items-end justify-between">
        <div>
          <span className="mono text-[hsl(var(--accent))]">Follow the expression</span>
          <h2 className="serif mt-4 text-5xl md:text-7xl">From the <i>studio.</i></h2>
        </div>
        <span className="mono hidden md:block">@lozia.studio</span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.slice(0,4).map((p) => <div key={p.id} className="relative aspect-square overflow-hidden bg-[hsl(var(--muted))]"><LoziaImage src={p.images[0]} alt={`${p.name} on Instagram`} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover image-hover" /></div>)}
      </div>
    </section>
  </div>;
}

export function ShopPage({ initialCategory }: { initialCategory?: string }) {
  const { products } = useCmsWorkspace();
  const bag = useBag();
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState(['Dresses','Sets','Tailoring','Tops','Bottoms'].includes(initialCategory || '') ? initialCategory! : 'All');
  const [sort,setSort]=useState('Featured');
  const [sizes,setSizes]=useState('All');
  const [colour,setColour]=useState('All');
  const [availability,setAvailability]=useState('All');
  const [price,setPrice]=useState('All');
  const [quick,setQuick]=useState<Product|null>(null);

  const shown = useMemo(
    () => products
      .filter(
        (p) =>
          (!query || `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())) &&
          (category === 'All' || p.category === category) &&
          (sizes === 'All' || p.sizes.includes(sizes)) &&
          (colour === 'All' || p.colours.some(c => c.name === colour)) &&
          (availability === 'All' || (availability === 'In stock' ? p.variants.some(v => v.stock > 0) : p.variants.every(v => v.stock === 0))) &&
          (price === 'All' || (price === 'Under ₦150,000' ? p.price < 150000 : p.price >= 150000))
      )
      .sort((a,b)=>sort==='Price low to high'?a.price-b.price:sort==='Price high to low'?b.price-a.price:(b.featured?1:0)-(a.featured?1:0)),
    [products, query,category,sort,sizes,colour,availability,price]
  );

  return <main className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-20">
    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div>
        <span className="mono text-[hsl(var(--accent))]">The collection</span>
        <h1 className="serif mt-3 text-6xl md:text-8xl">Shop LOZIA.</h1>
        <p className="mt-4 max-w-[410px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">Considered pieces for work, evenings and every expression in between.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-[hsl(var(--foreground))] pb-2 md:w-64">
        <Search size={16} strokeWidth={1.3}/>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search the collection" aria-label="Search products" data-testid="input-search-products" />
      </div>
    </div>

    <div className="mt-12 flex flex-wrap items-center gap-3 border-y border-[hsl(var(--border))] py-4">
      <span className="mono mr-3 text-[hsl(var(--muted-foreground))]">Filter</span>
      {['All','Dresses','Sets','Tailoring','Tops','Bottoms'].map((item)=><button key={item} onClick={()=>setCategory(item)} className={`border px-3 py-2 text-xs ${category===item?'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]':'border-[hsl(var(--border))]'}`} data-testid={`filter-category-${item.toLowerCase()}`}>{item}</button>)}

      <select value={sizes} onChange={(e)=>setSizes(e.target.value)} className="ml-auto border-b border-[hsl(var(--border))] bg-transparent px-2 py-2 text-xs outline-none" aria-label="Filter by size" data-testid="select-size-filter">
        <option value="All">All sizes</option>
        {['XS','S','M','L','XL'].map(s=><option key={s}>{s}</option>)}
      </select>

      <select value={colour} onChange={(e)=>setColour(e.target.value)} className="border-b border-[hsl(var(--border))] bg-transparent px-2 py-2 text-xs outline-none" aria-label="Filter by colour" data-testid="select-colour-filter">
        <option value="All">All colours</option>
        {['Terracotta','Ochre','Ink','Espresso','Bone','Sage','Parchment','Noir','Cocoa','Burnt Rose','Milk','Dusty Rose','Olive'].map(c=><option key={c} value={c}>{c}</option>)}
      </select>

      <select value={availability} onChange={(e)=>setAvailability(e.target.value)} className="border-b border-[hsl(var(--border))] bg-transparent px-2 py-2 text-xs outline-none" aria-label="Filter by availability" data-testid="select-availability-filter">
        <option value="All">All availability</option>
        <option>In stock</option>
        <option>Sold out</option>
      </select>

      <select value={price} onChange={(e)=>setPrice(e.target.value)} className="border-b border-[hsl(var(--border))] bg-transparent px-2 py-2 text-xs outline-none" aria-label="Filter by price" data-testid="select-price-filter">
        <option value="All">All prices</option>
        <option value="Under ₦150,000">Under ₦150,000</option>
        <option value="₦150,000 and above">₦150,000 and above</option>
      </select>

      <select value={sort} onChange={(e)=>setSort(e.target.value)} className="border-b border-[hsl(var(--border))] bg-transparent px-2 py-2 text-xs outline-none" aria-label="Sort products" data-testid="select-sort">
        <option>Featured</option>
        <option>Newest</option>
        <option>Price low to high</option>
        <option>Price high to low</option>
      </select>
    </div>

    <div className="mt-10">
      {shown.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-7">
          {shown.map(p=><ProductCard key={p.id} product={p} onQuickAdd={setQuick}/>)}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-[hsl(var(--border))] text-center">
          <Search className="text-[hsl(var(--accent))]" size={28} strokeWidth={1}/>
          <h2 className="serif mt-5 text-2xl">Nothing found.</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Try a different phrase or filter.</p>
        </div>
      )}
    </div>

    {quick && <QuickAdd product={quick} onClose={()=>setQuick(null)} bag={bag}/>}
  </main>;
}

function QuickAdd({ product, onClose, bag }: { product: Product; onClose:()=>void; bag: ReturnType<typeof useBag> }) {
  const [colour,setColour]=useState(product.colours[0].name);
  const [size,setSize]=useState(product.sizes[0]);

  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-[hsl(var(--foreground))]/30 p-4 md:items-center">
    <div className="w-full max-w-md bg-[hsl(var(--card))] p-7">
      <div className="flex justify-between">
        <div>
          <span className="mono text-[hsl(var(--muted-foreground))]">Quick edit</span>
          <h2 className="serif mt-1 text-3xl">{product.name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close quick add" data-testid="button-close-quick-add"><X size={20}/></button>
      </div>

      <div className="mt-7">
        <span className="mono">Colour</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.colours.map(c=><button key={c.name} onClick={()=>setColour(c.name)} className={`border px-3 py-2 text-xs ${colour===c.name?'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white':''}`} data-testid={`quick-colour-${c.name}`}>{c.name}</button>)}
        </div>

        <span className="mt-6 block mono">Size</span>
        <div className="mt-3 flex gap-2">
          {product.sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={`h-9 w-10 border text-xs ${size===s?'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white':''}`} data-testid={`quick-size-${s}`}>{s}</button>)}
        </div>
      </div>

      <button onClick={()=>{bag.add(product,colour,size); onClose();}} className="mt-8 flex w-full items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 mono text-white" data-testid="button-confirm-quick-add">Add to bag <Plus size={15}/></button>
    </div>
  </div>;
}

export function ProductPage({ slug, initialColour }: { slug?: string; initialColour?: string }) {
  const { products } = useCmsWorkspace();
  const product=products.find((item) => item.slug === slug);
  const bag=useBag();
  // Selections stay null until the shopper picks one, so they follow the product if the catalogue is edited.
  const [pickedColour,setColour]=useState<string|null>(null);
  const [pickedSize,setSize]=useState<string|null>(null);
  const [quantity,setQuantity]=useState(1);
  const [notice,setNotice]=useState('');
  const [saved,setSaved]=useState(false);

  const requestedColour=product?.colours.find((item)=>item.name.toLowerCase()===initialColour?.toLowerCase())?.name;
  const colour=pickedColour ?? requestedColour ?? product?.colours[0]?.name ?? '';
  const size=pickedSize ?? product?.sizes[0] ?? '';

  if (!product) return <InfoPage title="Piece not found" intro="This piece may have moved on, but there is more to discover." />;

  const variant=product.variants.find(v=>v.colour===colour&&v.size===size);
  const add=()=>{if(!variant?.stock)return;bag.add(product,colour,size,quantity);setNotice('Added to your bag.');setTimeout(()=>setNotice(''),2500);};

  return <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-14">
    <Link href="/shop" className="mb-8 inline-flex items-center gap-2 mono text-[hsl(var(--muted-foreground))]" data-testid="link-back-shop"><ArrowLeft size={14}/> Back to collection</Link>

    <div className="grid gap-10 md:grid-cols-[1.1fr_.9fr] md:gap-20">
      <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--muted))]">
        <GarmentColorizer src={product.images[0]} target={product.colours.find(c=>c.name===colour)?.hex || product.colours[0].hex} original={product.originalColor} originalHex={product.colours.find(c=>c.name===product.originalColor)?.hex} alt={product.name} className="h-full w-full object-cover" mask={product.colourMask}/>
        <span className="absolute bottom-4 left-4 bg-[hsl(var(--card))] px-3 py-2 mono text-[9px]">{product.colourMask ? 'Precision garment mask' : 'Automatic garment segmentation'}</span>
      </div>

      <div className="max-w-[480px] pt-2 md:pt-10">
        <div className="flex justify-between">
          <div>
            <span className="mono text-[hsl(var(--accent))]">{product.category}</span>
            <h1 className="serif mt-3 text-5xl leading-none md:text-7xl">{product.name}</h1>
          </div>
          <button onClick={()=>setSaved(!saved)} className="mt-1" aria-label="Save product" data-testid="button-save-product"><Heart size={21} strokeWidth={1.2} fill={saved?'currentColor':'none'}/></button>
        </div>

        <p className="mt-7 text-base leading-7 text-[hsl(var(--muted-foreground))]">{product.description}</p>
        <p className="mt-7 text-lg">{naira(product.price)}</p>

        <div className="mt-10 border-t border-[hsl(var(--border))] pt-6">
          <div className="flex justify-between">
            <span className="mono">Colour — {colour}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Recoloured live</span>
          </div>

          <div className="mt-4 flex gap-3">
            {product.colours.map(c=><button onClick={()=>setColour(c.name)} key={c.name} className={`h-8 w-8 rounded-full border-2 ${colour===c.name?'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--background))] ring-offset-1 ring-offset-[hsl(var(--primary))]':'border-transparent'}`} style={{backgroundColor:c.hex}} aria-label={`Select ${c.name}`} data-testid={`button-colour-${c.name}`} />)}
          </div>

          <div className="mt-8 flex justify-between">
            <span className="mono">Size</span>
            <Link href="/size-guide" className="text-xs underline" data-testid="link-product-size-guide">Find your size</Link>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {product.sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={`border py-3 text-xs ${size===s?'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]':''}`} data-testid={`button-size-${s}`}>{s}</button>)}
          </div>

          {variant?.stock ? <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{variant.stock < 3 ? `Only ${variant.stock} left in this size` : 'Available now · Lagos studio'}</p> : <p className="mt-3 text-xs text-[hsl(var(--destructive))]">This combination is currently unavailable.</p>}

          <div className="mt-7 flex gap-3">
            <div className="flex items-center border border-[hsl(var(--border))]">
              <button className="p-4" onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="Decrease quantity" data-testid="button-product-decrease"><span>-</span></button>
              <span className="w-7 text-center text-sm">{quantity}</span>
              <button className="p-4" onClick={()=>setQuantity(quantity+1)} aria-label="Increase quantity" data-testid="button-product-increase"><Plus size={14}/></button>
            </div>

            <button disabled={!variant?.stock} onClick={add} className="flex flex-1 items-center justify-center gap-3 bg-[hsl(var(--primary))] py-4 mono text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-add-to-bag">Add to bag <ArrowRight size={15}/></button>
          </div>

          <button disabled={!variant?.stock} onClick={()=>{add();bag.setOpen(true);}} className="mt-3 w-full border border-[hsl(var(--primary))] py-4 mono disabled:opacity-40" data-testid="button-buy-now">Buy now</button>

          {notice&&<p className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--accent))]" data-testid="status-added"><Check size={15}/> {notice}</p>}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[hsl(var(--border))] pt-6 text-sm">
          <div>
            <span className="mono block text-[hsl(var(--muted-foreground))]">Fabric</span>
            <p className="mt-2">{product.fabric}</p>
          </div>
          <div>
            <span className="mono block text-[hsl(var(--muted-foreground))]">Care</span>
            <p className="mt-2">{product.care}</p>
          </div>
        </div>
      </div>
    </div>
  </main>;
}

/* FIXED: AboutPage now gets the WhatsApp URL from CMS settings */
export function AboutPage() {
  const { settings } = useCmsWorkspace();

  return <main>
    <section className="bg-[hsl(var(--primary))] px-5 py-16 text-[hsl(var(--primary-foreground))] md:px-16 md:py-24">
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[.9fr_1.1fr] md:items-center md:gap-20">
        <div>
          <span className="mono text-[hsl(var(--secondary))]">About LOZIA</span>
          <h1 className="serif mt-7 max-w-[850px] text-6xl leading-[.95] md:text-9xl">Clothing for<br /><i>becoming.</i></h1>
          <p className="mt-8 max-w-[420px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">An Abuja-born fashion label for the woman becoming more of herself, one considered piece at a time.</p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[hsl(var(--muted))]">
          <LoziaImage src="/images/lozia-about-hero.png" alt="LOZIA woman in a dark tailored suit" fill sizes="(min-width: 768px) 55vw, 100vw" loading="eager" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))]/45 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 bg-[hsl(var(--card))]/90 px-3 py-2 mono text-[9px] text-[hsl(var(--foreground))]">The LOZIA woman</span>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1100px] px-5 py-20 md:grid md:grid-cols-[.8fr_1.2fr] md:gap-28 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">Our point of view
        {/*<LoziaImage src="/images/muse-dress.jpg" alt="Muse dress" width={1024} height={1024} sizes="(min-width: 768px) 30vw, 100vw" className="h-auto w-full object-cover object-top" />*/}
        <LoziaImage src="/images/muse-dress.jpg" alt="Muse dress" width={1024} height={1024} className="h-full w-full object-cover object-top" />
      </span>
      <div>
        <p className="serif text-4xl leading-tight md:text-6xl">LOZIA is an Abuja-born fashion label built around a simple belief: what you wear should leave room for who you are.</p>
        <p className="mt-9 max-w-[560px] text-base leading-8 text-[hsl(var(--muted-foreground))]">We make pieces that hold their shape in the world. Quietly expressive, made in small numbers, and designed with the kind of intention that reveals itself over time. Every collection is an invitation to dress for the self you are becoming, not the version anyone else expects.</p>

        <div className="mt-14 grid gap-8 border-t border-[hsl(var(--border))] pt-7 md:grid-cols-2">
          <div>
            <span className="mono">01 / Abuja</span>
            <p className="mt-3 text-sm leading-6">Our home informs our pace, our warmth, and our instinct for a little drama.</p>
          </div>
          <div>
            <span className="mono">02 / Considered</span>
            <p className="mt-3 text-sm leading-6">Small runs, thoughtful fabrics, and silhouettes that earn their place in your wardrobe.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="grid md:grid-cols-2">
      <div className="relative h-[600px] w-full"><LoziaImage src="/images/lozia-blazer.jpg" alt="LOZIA studio tailoring" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /></div>

      <div className="flex items-center bg-[hsl(var(--accent))] p-10 md:p-20">
        <div>
          <span className="mono">Come by</span>
          <h2 className="serif mt-5 text-5xl">The studio<br />is open.</h2>
          <p className="mt-6 max-w-[300px] text-sm leading-7">For fittings, appointments and questions about a piece, write to hello@lozia.studio.</p>
          <p className="mt-6 text-sm">Mon–Fri, 10:00–17:00<br />Abuja, Nigeria</p>

          <div className="mt-8 flex flex-wrap gap-5">
            <a href="mailto:hello@lozia.studio" className="inline-flex items-center gap-2 border-b border-current pb-2 mono" data-testid="link-email-us">Email us <ArrowRight size={14}/></a>

            <a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-b border-current pb-2 mono" data-testid="link-about-whatsapp">
              <MessageCircle size={14}/> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>;
}

// Placeholder account: replace with the studio's real details before launch.
const bankDetails = { name: 'LOZIA Studio Ltd', account: 'GTBank · 0123456789' };

export function CheckoutPage() {
  const bag=useBag();
  const router=useRouter();
  const [placed,setPlaced]=useState<{ total:number; pieces:number }|null>(null);

  const submit=(e:FormEvent)=>{
    e.preventDefault();
    // Keep the total to show on the confirmation, then empty the bag.
    setPlaced({ total: bag.subtotal, pieces: bag.count });
    bag.clear();
  };

  if(!bag.hydrated)return <main className="mx-auto min-h-[60vh] max-w-[1200px] px-5 py-12 md:px-10 md:py-20" aria-busy="true" />;

  if(placed)return <main className="mx-auto max-w-[700px] px-5 py-28 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"><Check size={28}/></div>
    <span className="mono mt-8 block text-[hsl(var(--accent))]">Order received</span>
    <h1 className="serif mt-4 text-6xl">Thank you.</h1>
    <p className="mx-auto mt-6 max-w-[430px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">Your order is pending payment verification. We will confirm it by email as soon as your transfer reaches us.</p>
    <div className="mx-auto mt-8 max-w-[430px] border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-5 text-left text-sm">
      <span className="mono">Transfer to</span>
      <p className="mt-3">{bankDetails.name}</p>
      <p>{bankDetails.account}</p>
      <div className="mt-4 flex justify-between border-t border-[hsl(var(--accent))]/30 pt-4"><span className="mono">Total · {placed.pieces} {placed.pieces===1?'piece':'pieces'}</span><span>{naira(placed.total)}</span></div>
    </div>
    <Link href="/order-confirmed" className="mt-9 inline-flex items-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 mono text-white" data-testid="link-view-order">View order details <ArrowRight size={15}/></Link>
  </main>;

  return <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-20">
    <div className="mb-12">
      <span className="mono text-[hsl(var(--accent))]">Almost yours</span>
      <h1 className="serif mt-3 text-6xl md:text-8xl">Checkout.</h1>
    </div>

    {bag.items.length===0 ? (
      <div className="border border-dashed border-[hsl(var(--border))] p-16 text-center">
        <h2 className="serif text-3xl">Your bag is quiet.</h2>
        <Link href="/shop" className="mt-6 inline-block underline mono" data-testid="link-checkout-shop">Return to the collection</Link>
      </div>
    ) : (
      <div className="grid gap-14 md:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={submit} className="space-y-9">
          <fieldset>
            <legend className="serif text-3xl">Your details</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input required placeholder="First name" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-first-name"/>
              <input required placeholder="Last name" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none" data-testid="input-last-name"/>
              <input required type="email" placeholder="Email address" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none sm:col-span-2" data-testid="input-email"/>
              <input required placeholder="Phone number" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none sm:col-span-2" data-testid="input-phone"/>
            </div>
          </fieldset>

          <fieldset>
            <legend className="serif text-3xl">Delivery</legend>
            <div className="mt-5 grid gap-4">
              <input required placeholder="Address" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none" data-testid="input-address"/>
              <div className="grid gap-4 sm:grid-cols-2">
                <input required placeholder="City" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none" data-testid="input-city"/>
                <select className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none" data-testid="select-state">
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Rivers</option>
                  <option>Oyo</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="serif text-3xl">Payment</legend>
            <div className="mt-5 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-5">
              <div className="flex items-center gap-3"><Truck size={18} strokeWidth={1.2}/><span className="mono">Manual bank transfer</span></div>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">After placing your order, transfer the total to our studio account. Your order will remain pending until we verify payment.</p>
              <div className="mt-4 border-t border-[hsl(var(--accent))]/30 pt-4 text-sm"><p>{bankDetails.name}</p><p>{bankDetails.account}</p></div>
            </div>
          </fieldset>

          <button type="submit" className="flex w-full items-center justify-center gap-3 bg-[hsl(var(--primary))] py-4 mono text-white" data-testid="button-place-order">Place order <ArrowRight size={15}/></button>
        </form>

        <div className="h-fit bg-[hsl(var(--muted))] p-6 md:p-8">
          <h2 className="serif text-3xl">Your edit</h2>

          {bag.items.map(i=><div className="mt-5 flex gap-4 border-b border-[hsl(var(--border))] pb-4" key={i.variantId}>
            <div className="relative h-24 w-18 shrink-0 bg-[hsl(var(--muted))]"><LoziaImage src={i.image} alt={i.productName} fill sizes="72px" className="object-cover"/></div>
            <div className="flex-1">
              <p className="serif text-lg">{i.productName}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{i.selectedColour} · {i.selectedSize} · Qty {i.quantity}</p>
              <p className="mt-2 text-sm">{naira(i.unitPrice*i.quantity)}</p>
            </div>
          </div>)}

          <div className="mt-7 flex justify-between border-t border-[hsl(var(--border))] pt-5">
            <span className="mono">Total</span>
            <span>{naira(bag.subtotal)}</span>
          </div>

          <button onClick={()=>router.push('/shop')} className="mt-5 text-xs underline" data-testid="button-continue-shopping">Continue shopping</button>
        </div>
      </div>
    )}
  </main>;
}

export function InfoPage({ title, intro }: { title:string; intro:string }) {
  return <main className="mx-auto max-w-[900px] px-5 py-20 md:px-10 md:py-32">
    <span className="mono text-[hsl(var(--accent))]">LOZIA information</span>
    <h1 className="serif mt-5 text-6xl md:text-8xl">{title}</h1>
    <p className="mt-7 max-w-[600px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">{intro}</p>

    <div className="mt-14 space-y-10 border-t border-[hsl(var(--border))] pt-10 text-sm leading-7">
      <section>
        <h2 className="serif text-3xl">The details matter.</h2>
        <p className="mt-3 max-w-[650px]">We are here to make the considered choice feel easy. If anything is unclear, contact hello@lozia.studio and our studio team will help.</p>
      </section>

      <section>
        <h2 className="serif text-3xl">A note from the studio</h2>
        <p className="mt-3 max-w-[650px]">All LOZIA pieces are made in small runs and checked by hand. Slight variations are part of the character, not a flaw.</p>
      </section>
    </div>
  </main>;
}

export function ContactSection() {
  const { settings } = useCmsWorkspace();
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return <section id="contact" className="scroll-mt-20 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-20 md:px-10 md:py-28">
    <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[.8fr_1.2fr]">
      <div>
        <span className="mono text-[hsl(var(--accent))]">Let’s connect</span>
        <h2 className="serif mt-4 text-6xl">Come say<br /><i>hello.</i></h2>

        <div className="mt-8 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
          <p>Instagram · {settings.instagram}</p>
          <p>WhatsApp · {settings.whatsappDisplay}</p>
          <p>Email · {settings.email}</p>
        </div>

        <a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-3 border border-[hsl(var(--primary))] px-5 py-3 mono transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-contact-section-whatsapp">
          <MessageCircle size={16}/> Message on WhatsApp
        </a>
      </div>

      <form onSubmit={submit} className="grid gap-5">
        <label className="grid gap-2 text-xs">
          <span className="mono">Name</span>
          <input required className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="contact-name" />
        </label>

        <label className="grid gap-2 text-xs">
          <span className="mono">Email</span>
          <input required type="email" className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="contact-email" />
        </label>

        <label className="grid gap-2 text-xs">
          <span className="mono">Message</span>
          <textarea required rows={4} className="resize-none border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="contact-message" />
        </label>

        <button type="submit" className="mt-2 inline-flex w-fit items-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))]" data-testid="contact-submit">
          {sent ? 'Message ready to send' : 'Send message'} <ArrowRight size={15} />
        </button>
      </form>
    </div>
  </section>;
}

export function SizeGuidePage() {
  return <main className="mx-auto max-w-[1000px] px-5 py-20 md:px-10 md:py-32">
    <span className="mono text-[hsl(var(--accent))]">Find your fit</span>
    <h1 className="serif mt-5 text-6xl md:text-8xl">Size guide.</h1>
    <p className="mt-6 max-w-[500px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">Our pieces are designed to follow the body, not fight it. If you are between sizes, we recommend sizing up for a more relaxed line.</p>

    <div className="mt-14 overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-y border-[hsl(var(--border))]">
            <th className="py-4 mono">Size</th>
            <th className="py-4 mono">Bust</th>
            <th className="py-4 mono">Waist</th>
            <th className="py-4 mono">Hip</th>
            <th className="py-4 mono">UK</th>
          </tr>
        </thead>

        <tbody>
          {[
            ['XS','80–84 cm','62–66 cm','88–92 cm','6'],
            ['S','85–89 cm','67–71 cm','93–97 cm','8'],
            ['M','90–94 cm','72–76 cm','98–102 cm','10'],
            ['L','95–100 cm','77–82 cm','103–108 cm','12'],
            ['XL','101–106 cm','83–88 cm','109–114 cm','14']
          ].map(r=><tr key={r[0]} className="border-b border-[hsl(var(--border))]">
            <td className="py-5 serif text-xl">{r[0]}</td>
            {r.slice(1).map(c=><td key={c} className="py-5">{c}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  </main>;
}
