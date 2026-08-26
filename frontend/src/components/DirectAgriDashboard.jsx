"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Languages,
  Lock,
  MapPinned,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Star,
  Upload
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { forecast, initialBatches, kpis, parseListing, planRoute, roles, translations } from "@/lib/demo-data";
import { apiGet, apiPost } from "@/lib/api-client";
import { signOut } from "@/lib/auth-client";

const statusLabels = {
  ON_FARM: "On farm",
  IN_TRANSIT: "In transit",
  STORED: "Stored",
  SOLD: "Sold"
};

export default function DirectAgriDashboard({ initialRole = "farmer" }) {
  const router = useRouter();
  const role = initialRole;
  const [locale, setLocale] = useState("en");
  const [batches, setBatches] = useState(initialBatches);
  const [listing, setListing] = useState("2.5 tons onion from Nashik at Rs 23 per kg, ready tomorrow");
  const [bidBatch, setBidBatch] = useState("B-1402");
  const [qualityScore, setQualityScore] = useState(89);
  const [isListing, setIsListing] = useState(false);
  const [listingError, setListingError] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidMessage, setBidMessage] = useState("");
  const [batchLoadError, setBatchLoadError] = useState("");
  const [storageMessage, setStorageMessage] = useState("");
  const [isStorageAction, setIsStorageAction] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [availableOrder, setAvailableOrder] = useState(null);
  const [transporterMessage, setTransporterMessage] = useState("");
  const [governmentStats, setGovernmentStats] = useState(null);
  const t = translations[locale];
  const activeBatches = batches.filter((batch) => batch.status !== "SOLD");
  const route = useMemo(() => planRoute(activeBatches), [activeBatches]);
  const selectedRole = roles.find((item) => item.id === role) ?? roles[0];
  const ActiveRoleIcon = selectedRole.icon;

  useEffect(() => {
    const storedSession = window.localStorage.getItem("directagri-session");
    const session = storedSession ? JSON.parse(storedSession) : null;
    if (!session) router.replace("/login");
    else if (session.user.role !== initialRole) router.replace(`/dashboard/${session.user.role}`);
  }, [initialRole, router]);

  useEffect(() => {
    apiGet("/api/crop-batches")
      .then(({ batches: savedBatches }) => {
        setBatches(savedBatches);
        if (savedBatches[0]) setBidBatch(savedBatches[0].id);
      })
      .catch((error) => setBatchLoadError(error.message));
  }, []);

  useEffect(() => {
    if (role !== "transporter") return;
    apiGet("/api/orders/available")
      .then(({ orders }) => setAvailableOrder(orders[0] ?? null))
      .catch((error) => setTransporterMessage(error.message));
  }, [role]);

  useEffect(() => {
    if (role !== "government") return;
    apiGet("/api/government/stats")
      .then(({ adoption }) => setGovernmentStats(adoption))
      .catch(() => setGovernmentStats(null));
  }, [role]);

  async function addListing() {
    setIsListing(true);
    setListingError("");
    try {
      const { batch } = await apiPost("/api/crop-batches", { text: listing }, "farmer");
      setBatches((current) => [
        {
          ...batch,
          quality: batch.quality ?? 87,
          lat: 20.05 + Math.random() / 6,
          lng: 73.9 + Math.random() / 5
        },
        ...current
      ]);
    } catch (error) {
      setListingError(error.message);
    } finally {
      setIsListing(false);
    }
  }

  async function submitBid(batchId, offerPrice) {
    setIsSubmittingBid(true);
    setBidMessage("");
    try {
      const { bid } = await apiPost("/api/orders/bids", { batchId, offerPrice }, "buyer");
      setBidMessage(`Offer ${bid.id} submitted at Rs ${bid.offerPrice}/kg.`);
    } catch (error) {
      setBidMessage(error.message);
    } finally {
      setIsSubmittingBid(false);
    }
  }

  async function updateStorage(batchId, action) {
    setIsStorageAction(true);
    setStorageMessage("");
    try {
      const path = action === "checkin" ? "/api/storage/checkin" : "/api/storage/checkout";
      const { batch } = await apiPost(path, { batchId, qualityScore, photoUrl: "/demo/quality.jpg" }, "storage");
      setBatches((current) => current.map((item) => item.id === batch.id ? { ...item, status: batch.status } : item));
      setStorageMessage(`${action === "checkin" ? "Checked in" : "Checked out"} batch successfully.`);
    } catch (error) {
      setStorageMessage(error.message);
    } finally {
      setIsStorageAction(false);
    }
  }

  async function createOrder() {
    if (!batches.length) return;
    try {
      const { order } = await apiPost("/api/orders/aggregate", { batchIds: [batches[0].id] }, "buyer");
      setCurrentOrder(order);
      setOrderMessage(`Order ${order.id} created and escrow locked.`);
    } catch (error) {
      setOrderMessage(error.message);
    }
  }

  async function releaseEscrow() {
    if (!currentOrder) return;
    try {
      await apiPost(`/api/orders/${currentOrder.id}/release`, {}, "buyer");
      setCurrentOrder((order) => ({ ...order, escrowStatus: "RELEASED" }));
      setOrderMessage("Escrow released and payment records created.");
    } catch (error) {
      setOrderMessage(error.message);
    }
  }

  async function acceptDelivery() {
    if (!availableOrder) return;
    try {
      const { order } = await apiPost(`/api/orders/${availableOrder.id}/assign-transporter`, {}, "transporter");
      setAvailableOrder(null);
      setTransporterMessage(`Delivery ${order.id} accepted.`);
    } catch (error) {
      setTransporterMessage(error.message);
    }
  }

  const aggregate = activeBatches.reduce(
    (acc, batch) => {
      acc.quantity += batch.quantityKg;
      acc.value += batch.quantityKg * batch.pricePerKg;
      return acc;
    },
    { quantity: 0, value: 0 }
  );

  return (
    <main className="min-h-screen">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-soft lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--leaf)] text-white">
              <ShieldCheck size={23} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--leaf)]">SIH26033</p>
              <h1 className="text-2xl font-bold">DirectAgri</h1>
            </div>
          </div>
          <div className="mt-6 rounded-md bg-[var(--leaf)] px-3 py-3 text-white">
            <div className="flex items-center gap-3">
              <ActiveRoleIcon size={18} aria-hidden="true" />
              <span className="font-semibold">{selectedRole.label} dashboard</span>
            </div>
            <p className="mt-2 text-xs text-white/80">Your workspace is limited to this role.</p>
          </div>
          <label className="mt-6 flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
            <Languages size={17} aria-hidden="true" />
            <select className="focus-ring w-full bg-transparent font-semibold" value={locale} onChange={(event) => setLocale(event.target.value)} aria-label="Language">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="mr">Marathi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
              <option value="gu">Gujarati</option>
              <option value="ur">Urdu</option>
              <option value="kn">Kannada</option>
            </select>
          </label>
          <div className="mt-6 rounded-lg bg-[var(--sky)] p-4">
            <p className="text-sm font-semibold text-[var(--leaf-dark)]">RBAC proof point</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Storage can update location and quality records, while crop pricing remains farmer-owned.</p>
          </div>
          <button className="focus-ring mt-4 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold" onClick={() => { signOut(); router.replace("/"); }}>{t.logout}</button>
        </aside>

        <div className="space-y-5">
          <header className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--leaf)]">
                  <ActiveRoleIcon size={17} aria-hidden="true" />
                  {selectedRole.label} console
                </div>
                <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t.headline}</h2>
                <p className="mt-3 max-w-2xl text-base text-[var(--muted)]">{t.subhead}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[26rem]">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="rounded-lg border border-[var(--line)] bg-white p-3">
                      <Icon size={18} className="text-[var(--rust)]" aria-hidden="true" />
                      <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs font-semibold text-[var(--muted)]">{kpi.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
              {role === "farmer" && <FarmerPanel listing={listing} setListing={setListing} addListing={addListing} batches={batches} isListing={isListing} listingError={listingError} />}
              {role === "buyer" && <BuyerPanel batches={activeBatches} aggregate={aggregate} bidBatch={bidBatch} setBidBatch={setBidBatch} submitBid={submitBid} isSubmittingBid={isSubmittingBid} bidMessage={bidMessage} createOrder={createOrder} releaseEscrow={releaseEscrow} currentOrder={currentOrder} orderMessage={orderMessage} />}
              {role === "transporter" && <TransporterPanel route={route} availableOrder={availableOrder} acceptDelivery={acceptDelivery} transporterMessage={transporterMessage} />}
              {role === "storage" && <StoragePanel batches={activeBatches} qualityScore={qualityScore} setQualityScore={setQualityScore} updateStorage={updateStorage} isStorageAction={isStorageAction} storageMessage={storageMessage} />}
              {role === "government" && <GovernmentPanel batches={batches} stats={governmentStats} />}
            </section>
            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--leaf)]">Demand forecast</p>
                  <h3 className="text-xl font-bold">{t.forecast}</h3>
                </div>
                <span className="rounded-md bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">Mocked e-NAM</span>
              </div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ded3bd" />
                    <XAxis dataKey="crop" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="mandi" name="Mandi price" fill="#aa5739" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="platform" name="Platform avg" fill="#2f6f4e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          <Inventory batches={batches} t={t} />
          {batchLoadError && <p className="text-sm font-semibold text-[var(--rust)]" role="alert">{batchLoadError}</p>}
        </div>
      </section>
    </main>
  );
}

function FarmerPanel({ listing, setListing, addListing, batches, isListing, listingError }) {
  const parsed = parseListing(listing);
  return (
    <>
      <PanelTitle icon={MessageSquareText} label="Farmer" title="WhatsApp-style listing parser" />
      <textarea className="focus-ring mt-4 min-h-28 w-full rounded-md border border-[var(--line)] bg-white p-4" value={listing} onChange={(event) => setListing(event.target.value)} aria-label="Crop listing message" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ParsedTile label="Crop" value={parsed.crop} />
        <ParsedTile label="Quantity" value={`${parsed.quantityKg.toLocaleString()} kg`} />
        <ParsedTile label="Price" value={`₹${parsed.pricePerKg}/kg`} />
      </div>
      <button className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60" onClick={addListing} disabled={isListing}>
        <Plus size={18} aria-hidden="true" />
        {isListing ? "Saving..." : "List crop"}
      </button>
      {listingError && <p className="mt-3 text-sm font-semibold text-[var(--rust)]" role="alert">{listingError}</p>}
      <p className="mt-4 text-sm text-[var(--muted)]">{batches.filter((batch) => batch.farmer === "Demo Farmer").length} demo farmer listings added this session.</p>
    </>
  );
}

function BuyerPanel({ batches, aggregate, bidBatch, setBidBatch, submitBid, isSubmittingBid, bidMessage, createOrder, releaseEscrow, currentOrder, orderMessage }) {
  const selected = batches.find((batch) => batch.id === bidBatch) ?? batches[0];
  const averageQuality = batches.length ? Math.round(batches.reduce((sum, batch) => sum + batch.quality, 0) / batches.length) : 0;
  const offerPrice = Math.max(1, (selected?.pricePerKg ?? 3) - 2);
  return (
    <>
      <PanelTitle icon={Lock} label="Buyer" title="Bulk procurement and escrow" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ParsedTile label="Available stock" value={`${aggregate.quantity.toLocaleString()} kg`} />
        <ParsedTile label="Escrow value" value={`₹${Math.round(aggregate.value).toLocaleString()}`} />
        <ParsedTile label="Average quality" value={`${averageQuality} / 100`} />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-4">
        <label className="text-sm font-semibold text-[var(--muted)]" htmlFor="bid-batch">Negotiate batch</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <select id="bid-batch" className="focus-ring min-h-11 flex-1 rounded-md border border-[var(--line)] px-3" value={bidBatch} onChange={(event) => setBidBatch(event.target.value)}>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.crop} - {batch.farmer}</option>
            ))}
          </select>
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[var(--crop)] px-4 py-3 font-semibold text-[var(--ink)] disabled:cursor-wait disabled:opacity-60" onClick={() => selected && submitBid(selected.id, offerPrice)} disabled={!selected || isSubmittingBid}>
            <ArrowRight size={18} aria-hidden="true" />
            {isSubmittingBid ? "Submitting..." : `Offer Rs ${offerPrice}/kg`}
          </button>
        </div>
      </div>
      {bidMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{bidMessage}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="focus-ring rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={createOrder} disabled={!batches.length}>Create bulk order</button>
        <button className="focus-ring rounded-md border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-60" onClick={releaseEscrow} disabled={!currentOrder || currentOrder.escrowStatus !== "LOCKED"}>Release escrow</button>
      </div>
      {orderMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{orderMessage}</p>}
    </>
  );
}

function TransporterPanel({ route, availableOrder, acceptDelivery, transporterMessage }) {
  return (
    <>
      <PanelTitle icon={MapPinned} label="Transporter" title="Nearest-neighbor gig route" />
      <div className="mt-4 space-y-3">
        {route.map((batch, index) => (
          <div key={batch.id} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--leaf)] font-bold text-white">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{batch.village}, {batch.district}</p>
              <p className="text-sm text-[var(--muted)]">{batch.quantityKg.toLocaleString()} kg {batch.crop} from {batch.farmer}</p>
            </div>
            <Check className="text-[var(--leaf)]" size={19} aria-hidden="true" />
          </div>
        ))}
      </div>
      <button className="focus-ring mt-4 rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={acceptDelivery} disabled={!availableOrder}>Accept available delivery</button>
      {transporterMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{transporterMessage}</p>}
    </>
  );
}

function StoragePanel({ batches, qualityScore, setQualityScore, updateStorage, isStorageAction, storageMessage }) {
  const pendingBatch = batches.find((batch) => batch.status === "ON_FARM");
  const storedBatch = batches.find((batch) => batch.status === "STORED");
  return (
    <>
      <PanelTitle icon={Upload} label="Storage" title="Quality record at check-in" />
      <div className="mt-4 rounded-lg border border-dashed border-[var(--leaf)] bg-white p-5 text-center">
        <Upload className="mx-auto text-[var(--leaf)]" size={28} aria-hidden="true" />
        <p className="mt-2 font-semibold">Photo upload stub</p>
        <p className="text-sm text-[var(--muted)]">Demo mode records a quality score without external vision calls.</p>
      </div>
      <label className="mt-4 block text-sm font-semibold text-[var(--muted)]">Quality score: {qualityScore}</label>
      <input className="mt-2 w-full accent-[var(--leaf)]" type="range" min="50" max="100" value={qualityScore} onChange={(event) => setQualityScore(Number(event.target.value))} />
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="focus-ring rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={() => pendingBatch && updateStorage(pendingBatch.id, "checkin")} disabled={!pendingBatch || isStorageAction}>Check in next batch</button>
        <button className="focus-ring rounded-md border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-60" onClick={() => storedBatch && updateStorage(storedBatch.id, "checkout")} disabled={!storedBatch || isStorageAction}>Check out stored batch</button>
      </div>
      {storageMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{storageMessage}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ParsedTile label="Pending check-ins" value={String(batches.filter((batch) => batch.status === "ON_FARM").length)} />
        <ParsedTile label="Rent ledger" value="₹0.42/kg/day" />
      </div>
    </>
  );
}

function GovernmentPanel({ batches, stats }) {
  return (
    <>
      <PanelTitle icon={ShieldCheck} label="Government" title="Read-only impact dashboard" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ParsedTile label="Districts covered" value={String(stats?.districtsCovered ?? 0)} />
        <ParsedTile label="Batches audited" value={String(stats?.activeBatches ?? batches.length)} />
        <ParsedTile label="Open disputes" value={String(stats?.openDisputes ?? 0)} />
        <ParsedTile label="Audit events" value={String(stats?.auditEvents ?? 0)} />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--leaf)]">Ministry view</p>
        <p className="mt-1 text-sm text-[var(--muted)]">This dashboard is intentionally read-only: policy teams can inspect adoption, price uplift, quality records, and audit events without affecting live trade.</p>
      </div>
    </>
  );
}

function Inventory({ batches, t }) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--leaf)]">{t.inventory}</p>
          <h3 className="text-xl font-bold">Farmer-owned crop batches</h3>
        </div>
        <span className="text-sm font-semibold text-[var(--muted)]">{batches.length} {t.records}</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--muted)]">
              <th className="py-3 pr-4">Batch</th>
              <th className="py-3 pr-4">Crop</th>
              <th className="py-3 pr-4">Owner</th>
              <th className="py-3 pr-4">Quantity</th>
              <th className="py-3 pr-4">Price</th>
              <th className="py-3 pr-4">Quality</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-[var(--line)] last:border-0">
                <td className="py-3 pr-4 font-semibold">{batch.id}</td>
                <td className="py-3 pr-4">{batch.crop}</td>
                <td className="py-3 pr-4">{batch.farmer}</td>
                <td className="py-3 pr-4">{batch.quantityKg.toLocaleString()} kg</td>
                <td className="py-3 pr-4">₹{batch.pricePerKg}/kg</td>
                <td className="py-3 pr-4"><span className="inline-flex items-center gap-1"><Star size={15} className="fill-[var(--crop)] text-[var(--crop)]" aria-hidden="true" />{batch.quality}</span></td>
                <td className="py-3 pr-4"><span className="rounded-md bg-[var(--panel-strong)] px-2 py-1 font-semibold">{statusLabels[batch.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PanelTitle({ icon: Icon, label, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--leaf)] text-white">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--leaf)]">{label}</p>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
    </div>
  );
}

function ParsedTile({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-4">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold">{value}</p>
    </div>
  );
}
