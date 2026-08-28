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
import { forecast as demoForecast, initialBatches, kpis, parseListing, planRoute, roles, translations } from "@/lib/demo-data";
import { apiGet, apiPost } from "@/lib/api-client";
import { getSession, signOut } from "@/lib/auth-client";
import { applyLocale, dashboardTranslations, getLocale, languageOptions, setLocale } from "@/lib/i18n";

export default function DirectAgriDashboard({ initialRole = "farmer" }) {
  const router = useRouter();
  const role = initialRole;
  const [locale, setCurrentLocale] = useState(getLocale);
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
  const [forecastData, setForecastData] = useState(demoForecast);
  const t = { ...(translations[locale] ?? translations.en), ...(dashboardTranslations[locale] ?? dashboardTranslations.en) };
  const farmerName = getSession()?.user?.name;
  const activeBatches = batches.filter((batch) => batch.status !== "SOLD");
  const route = useMemo(() => planRoute(activeBatches), [activeBatches]);
  const selectedRole = roles.find((item) => item.id === role) ?? roles[0];
  const ActiveRoleIcon = selectedRole.icon;

  useEffect(() => {
    const session = getSession();
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

  useEffect(() => {
    apiGet("/api/forecast").then(({ forecast: savedForecast }) => {
      if (savedForecast?.length) setForecastData(savedForecast);
    }).catch(() => setForecastData(demoForecast));
  }, []);

  useEffect(() => {
    applyLocale(locale);
    setLocale(locale);
  }, [locale]);

  function changeLocale(nextLocale) {
    setCurrentLocale(nextLocale);
    setLocale(nextLocale);
  }

  async function addListing() {
    setIsListing(true);
    setListingError("");
    try {
      const { batch } = await apiPost("/api/crop-batches", { text: listing }, "farmer");
      setBatches((current) => [
        {
          ...batch,
          quality: batch.quality ?? 87,
          lat: Number.isFinite(batch.lat) ? batch.lat : 20.05 + Math.random() / 6,
          lng: Number.isFinite(batch.lng) ? batch.lng : 73.9 + Math.random() / 5
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
      setBatches((current) => current.map((item) => item.id === batch.id ? { ...item, status: batch.status, quality: batch.quality ?? item.quality } : item));
      setStorageMessage(`${action === "checkin" ? "Checked in" : "Checked out"} batch successfully.`);
    } catch (error) {
      setStorageMessage(error.message);
    } finally {
      setIsStorageAction(false);
    }
  }

  async function createOrder() {
    if (!activeBatches.length) return;
    try {
      const { order } = await apiPost("/api/orders/aggregate", { batchIds: [activeBatches[0].id] }, "buyer");
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
              <span className="font-semibold">{t[selectedRole.id]} {t.dashboard}</span>
            </div>
            <p className="mt-2 text-xs text-white/80">{t.limited}</p>
          </div>
          <label className="mt-6 flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
            <Languages size={17} aria-hidden="true" />
            <select className="focus-ring w-full bg-transparent font-semibold" value={locale} onChange={(event) => changeLocale(event.target.value)} aria-label="Language">
              {languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <div className="mt-6 rounded-lg bg-[var(--sky)] p-4">
            <p className="text-sm font-semibold text-[var(--leaf-dark)]">{t.rbac}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{t.rbacText}</p>
          </div>
          <button className="focus-ring mt-4 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold" onClick={() => { signOut(); router.replace("/"); }}>{t.logout}</button>
        </aside>

        <div className="space-y-5">
          <header className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--leaf)]">
                  <ActiveRoleIcon size={17} aria-hidden="true" />
                  {t[selectedRole.id]} {t.console}
                </div>
                <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t.headline}</h2>
                <p className="mt-3 max-w-2xl text-base text-[var(--muted)]">{t.subhead}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[26rem]">
                {kpis.map((kpi, index) => {
                  const Icon = kpi.icon;
                  const labels = [t.margin, t.participants, t.active, t.uplift];
                  return (
                    <div key={kpi.label} className="rounded-lg border border-[var(--line)] bg-white p-3">
                      <Icon size={18} className="text-[var(--rust)]" aria-hidden="true" />
                      <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs font-semibold text-[var(--muted)]">{labels[index] ?? kpi.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
              {role === "farmer" && <FarmerPanel listing={listing} setListing={setListing} addListing={addListing} batches={batches} isListing={isListing} listingError={listingError} farmerName={farmerName} t={t} />}
              {role === "buyer" && <BuyerPanel batches={activeBatches} aggregate={aggregate} bidBatch={bidBatch} setBidBatch={setBidBatch} submitBid={submitBid} isSubmittingBid={isSubmittingBid} bidMessage={bidMessage} createOrder={createOrder} releaseEscrow={releaseEscrow} currentOrder={currentOrder} orderMessage={orderMessage} t={t} />}
              {role === "transporter" && <TransporterPanel route={route} availableOrder={availableOrder} acceptDelivery={acceptDelivery} transporterMessage={transporterMessage} t={t} />}
              {role === "storage" && <StoragePanel batches={activeBatches} qualityScore={qualityScore} setQualityScore={setQualityScore} updateStorage={updateStorage} isStorageAction={isStorageAction} storageMessage={storageMessage} t={t} />}
              {role === "government" && <GovernmentPanel batches={batches} stats={governmentStats} t={t} />}
            </section>
            <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--leaf)]">{t.demand}</p>
                  <h3 className="text-xl font-bold">{t.forecast}</h3>
                </div>
                <span className="rounded-md bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">{t.mocked}</span>
              </div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ded3bd" />
                    <XAxis dataKey="crop" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="mandi" name={t.mandi} fill="#aa5739" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="platform" name={t.platform} fill="#2f6f4e" radius={[4, 4, 0, 0]} />
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

function FarmerPanel({ listing, setListing, addListing, batches, isListing, listingError, farmerName, t }) {
  const parsed = parseListing(listing);
  const ownListings = batches.filter((batch) => farmerName && batch.farmer === farmerName).length;
  return (
    <>
      <PanelTitle icon={MessageSquareText} label={t.farmerPanel} title={t.listing} />
      <textarea className="focus-ring mt-4 min-h-28 w-full rounded-md border border-[var(--line)] bg-white p-4" value={listing} onChange={(event) => setListing(event.target.value)} aria-label="Crop listing message" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ParsedTile label={t.crop} value={parsed.crop} />
        <ParsedTile label={t.quantity} value={`${(parsed.quantityKg ?? 0).toLocaleString()} ${t.kg}`} />
        <ParsedTile label={t.price} value={`₹${parsed.pricePerKg}/${t.kg}`} />
      </div>
      <button className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60" onClick={addListing} disabled={isListing}>
        <Plus size={18} aria-hidden="true" />
        {isListing ? t.saving : t.listCrop}
      </button>
      {listingError && <p className="mt-3 text-sm font-semibold text-[var(--rust)]" role="alert">{listingError}</p>}
      <p className="mt-4 text-sm text-[var(--muted)]">{ownListings} {t.ownListings}</p>
    </>
  );
}

function BuyerPanel({ batches, aggregate, bidBatch, setBidBatch, submitBid, isSubmittingBid, bidMessage, createOrder, releaseEscrow, currentOrder, orderMessage, t }) {
  const selected = batches.find((batch) => batch.id === bidBatch) ?? batches[0];
  const averageQuality = batches.length ? Math.round(batches.reduce((sum, batch) => sum + (batch.quality ?? 0), 0) / batches.length) : 0;
  const offerPrice = Math.max(1, (selected?.pricePerKg ?? 3) - 2);
  return (
    <>
      <PanelTitle icon={Lock} label={t.buyer} title={`${t.available} / ${t.escrow}`} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ParsedTile label={t.available} value={`${(aggregate.quantity ?? 0).toLocaleString()} ${t.kg}`} />
        <ParsedTile label={t.escrow} value={`₹${Math.round(aggregate.value).toLocaleString()}`} />
        <ParsedTile label={t.quality} value={`${averageQuality} / 100`} />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-4">
        <label className="text-sm font-semibold text-[var(--muted)]" htmlFor="bid-batch">{t.negotiate}</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <select id="bid-batch" className="focus-ring min-h-11 flex-1 rounded-md border border-[var(--line)] px-3" value={bidBatch} onChange={(event) => setBidBatch(event.target.value)}>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.crop} - {batch.farmer}</option>
            ))}
          </select>
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[var(--crop)] px-4 py-3 font-semibold text-[var(--ink)] disabled:cursor-wait disabled:opacity-60" onClick={() => selected && submitBid(selected.id, offerPrice)} disabled={!selected || isSubmittingBid}>
            <ArrowRight size={18} aria-hidden="true" />
            {isSubmittingBid ? t.submit : `${t.buyerOffer} · ₹${offerPrice}/${t.kg}`}
          </button>
        </div>
      </div>
      {bidMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{bidMessage}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="focus-ring rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={createOrder} disabled={!batches.length}>{t.bulkOrder}</button>
        <button className="focus-ring rounded-md border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-60" onClick={releaseEscrow} disabled={!currentOrder || currentOrder.escrowStatus !== "LOCKED"}>{t.release}</button>
      </div>
      {orderMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{orderMessage}</p>}
    </>
  );
}

function TransporterPanel({ route, availableOrder, acceptDelivery, transporterMessage, t }) {
  return (
    <>
      <PanelTitle icon={MapPinned} label={t.transporter} title={t.route} />
      <div className="mt-4 space-y-3">
        {route.map((batch, index) => (
          <div key={batch.id} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--leaf)] font-bold text-white">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{batch.village ?? t.nearby}, {batch.district ?? "Nashik"}</p>
              <p className="text-sm text-[var(--muted)]">{(batch.quantityKg ?? 0).toLocaleString()} {t.kg} {batch.crop} {t.from} {batch.farmer}</p>
            </div>
            <Check className="text-[var(--leaf)]" size={19} aria-hidden="true" />
          </div>
        ))}
      </div>
      <button className="focus-ring mt-4 rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={acceptDelivery} disabled={!availableOrder}>{t.accept}</button>
      {transporterMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{transporterMessage}</p>}
    </>
  );
}

function StoragePanel({ batches, qualityScore, setQualityScore, updateStorage, isStorageAction, storageMessage, t }) {
  const pendingBatch = batches.find((batch) => batch.status === "ON_FARM");
  const storedBatch = batches.find((batch) => batch.status === "STORED");
  return (
    <>
      <PanelTitle icon={Upload} label={t.storage} title={t.storagePanel} />
      <div className="mt-4 rounded-lg border border-dashed border-[var(--leaf)] bg-white p-5 text-center">
        <Upload className="mx-auto text-[var(--leaf)]" size={28} aria-hidden="true" />
        <p className="mt-2 font-semibold">{t.photo}</p>
        <p className="text-sm text-[var(--muted)]">{t.photoText}</p>
      </div>
      <label className="mt-4 block text-sm font-semibold text-[var(--muted)]">{t.score}: {qualityScore}</label>
      <input className="mt-2 w-full accent-[var(--leaf)]" type="range" min="50" max="100" value={qualityScore} onChange={(event) => setQualityScore(Number(event.target.value))} />
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="focus-ring rounded-md bg-[var(--leaf)] px-4 py-3 font-semibold text-white disabled:opacity-60" onClick={() => pendingBatch && updateStorage(pendingBatch.id, "checkin")} disabled={!pendingBatch || isStorageAction}>{t.checkIn}</button>
        <button className="focus-ring rounded-md border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-60" onClick={() => storedBatch && updateStorage(storedBatch.id, "checkout")} disabled={!storedBatch || isStorageAction}>{t.checkOut}</button>
      </div>
      {storageMessage && <p className="mt-3 text-sm font-semibold text-[var(--leaf)]" role="status">{storageMessage}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ParsedTile label={t.pending} value={String(batches.filter((batch) => batch.status === "ON_FARM").length)} />
        <ParsedTile label={t.rent} value={`₹0.42/${t.kg}/day`} />
      </div>
    </>
  );
}

function GovernmentPanel({ batches, stats, t }) {
  return (
    <>
      <PanelTitle icon={ShieldCheck} label={t.government} title={t.governmentPanel} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ParsedTile label={t.districts} value={String(stats?.districtsCovered ?? 0)} />
        <ParsedTile label={t.audited} value={String(stats?.activeBatches ?? batches.length)} />
        <ParsedTile label={t.disputes} value={String(stats?.openDisputes ?? 0)} />
        <ParsedTile label={t.audits} value={String(stats?.auditEvents ?? 0)} />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--leaf)]">{t.ministry}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.ministryText}</p>
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
          <h3 className="text-xl font-bold">{t.inventoryTitle}</h3>
        </div>
        <span className="text-sm font-semibold text-[var(--muted)]">{batches.length} {t.records}</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--muted)]">
              <th className="py-3 pr-4">{t.batch}</th><th className="py-3 pr-4">{t.crop}</th><th className="py-3 pr-4">{t.owner}</th><th className="py-3 pr-4">{t.quantity}</th><th className="py-3 pr-4">{t.price}</th><th className="py-3 pr-4">{t.quality}</th><th className="py-3 pr-4">{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-[var(--line)] last:border-0">
                <td className="py-3 pr-4 font-semibold">{batch.id}</td>
                <td className="py-3 pr-4">{batch.crop}</td>
                <td className="py-3 pr-4">{batch.farmer}</td>
                <td className="py-3 pr-4">{(batch.quantityKg ?? 0).toLocaleString()} {t.kg}</td>
                <td className="py-3 pr-4">₹{batch.pricePerKg}/{t.kg}</td>
                <td className="py-3 pr-4"><span className="inline-flex items-center gap-1"><Star size={15} className="fill-[var(--crop)] text-[var(--crop)]" aria-hidden="true" />{batch.quality ?? "—"}</span></td>
                <td className="py-3 pr-4"><span className="rounded-md bg-[var(--panel-strong)] px-2 py-1 font-semibold">{{ ON_FARM: t.onFarm, IN_TRANSIT: t.inTransit, STORED: t.stored, SOLD: t.sold }[batch.status] ?? batch.status}</span></td>
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
