"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle,
  Loader2,
  Plus,
  DollarSign,
  ArrowRightLeft,
  Download,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { generateInvoicePdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/common/loading";

const STATUS_TABS = [
  { label: "Tous", value: undefined, isEstimate: false as const },
  { label: "Brouillon", value: "draft", isEstimate: false as const },
  { label: "Envoyées", value: "sent", isEstimate: false as const },
  { label: "Payées", value: "paid", isEstimate: false as const },
  { label: "En retard", value: "overdue", isEstimate: false as const },
  { label: "Devis", value: undefined, isEstimate: true as const },
] as const;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-gray-100 text-gray-500",
  partial: "bg-amber-100 text-amber-700",
  estimate: "bg-purple-100 text-purple-700",
};

const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Debit Card", value: "debit_card" },
  { label: "Check", value: "check" },
  { label: "Online", value: "online" },
  { label: "Other", value: "other" },
] as const;

function formatCurrency(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getDisplayStatus(invoice: {
  status: string;
  paidAmount: string | null;
  total: string | null;
  isEstimate: boolean;
}): { label: string; style: string } {
  if (invoice.isEstimate) {
      return { label: "Devis", style: STATUS_STYLES.estimate };
    }
    const paid = Number(invoice.paidAmount ?? 0);
    const total = Number(invoice.total ?? 0);
    if (paid > 0 && paid < total && invoice.status !== "paid") {
      return { label: "Partiel", style: STATUS_STYLES.partial };
    }
    const labelMap: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyée",
      paid: "Payée",
      overdue: "En retard",
      void: "Annulée",
      partial: "Partiel",
    };
    return {
      label: labelMap[invoice.status] ?? invoice.status,
      style: STATUS_STYLES[invoice.status] ?? "bg-gray-100 text-gray-700",
  };
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const tab = STATUS_TABS[activeTab];
  const statusFilter = tab.isEstimate ? undefined : tab.value;
  const isEstimateFilter = tab.isEstimate ? true : false;

  const { data, isLoading, error } = trpc.billing.listInvoices.useQuery({
    status: statusFilter,
    isEstimate: isEstimateFilter,
    limit,
    offset,
  });

  const utils = trpc.useUtils();

  const updateStatus = trpc.billing.updateInvoiceStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de la facture mis à jour");
      utils.billing.listInvoices.invalidate();
      utils.billing.getInvoice.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const convertEstimate = trpc.billing.convertEstimateToInvoice.useMutation({
    onSuccess: () => {
      toast.success("Devis converti en facture");
      utils.billing.listInvoices.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleStatusChange = (
    e: React.MouseEvent,
    id: string,
    status: "sent" | "paid"
  ) => {
    e.stopPropagation();
    updateStatus.mutate({ id, status });
  };

  const handleConvertEstimate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    convertEstimate.mutate({ id });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Facturation</h2>
          <p className="text-sm text-muted-foreground">
            Factures et paiements
          </p>
        </div>
        <Button asChild>
          <Link href="/billing/new">
            <Plus className="mr-1 h-4 w-4" />
            Nouvelle facture
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-border">
        {STATUS_TABS.map((t, idx) => (
          <button
            key={t.label}
            onClick={() => {
              setActiveTab(idx);
              setOffset(0);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === idx
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-8 px-2 py-3" />
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Payé
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Échéance
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Créé
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    isExpanded={expandedId === invoice.id}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === invoice.id ? null : invoice.id
                      )
                    }
                    onStatusChange={handleStatusChange}
                    onConvertEstimate={handleConvertEstimate}
                    isMutating={
                      updateStatus.isPending || convertEstimate.isPending
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Affichage de {offset + 1} à {Math.min(offset + limit, data.total)} sur {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + limit >= data.total}
                onClick={() => setOffset(offset + limit)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            {tab.isEstimate
              ? "Aucun devis pour le moment"
              : statusFilter
              ? "Aucune facture avec ce statut"
              : "Aucune facture pour le moment"}
          </p>
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  isExpanded,
  onToggle,
  onStatusChange,
  onConvertEstimate,
  isMutating,
}: {
  invoice: {
    id: string;
    status: string;
    subtotal: string | null;
    tax: string | null;
    total: string | null;
    paidAmount: string | null;
    dueDate: string | null;
    createdAt: Date | string | null;
    isEstimate: boolean;
    clientFirstName: string | null;
    clientLastName: string | null;
    patientName: string | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (
    e: React.MouseEvent,
    id: string,
    status: "sent" | "paid"
  ) => void;
  onConvertEstimate: (e: React.MouseEvent, id: string) => void;
  isMutating: boolean;
}) {
  const detail = trpc.billing.getInvoice.useQuery(
    { id: invoice.id },
    { enabled: isExpanded }
  );

  const displayStatus = getDisplayStatus(invoice);

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      >
        <td className="px-2 py-3 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-4 py-3 font-medium">
          {invoice.clientFirstName} {invoice.clientLastName}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {invoice.patientName || "\u2014"}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${displayStatus.style}`}
          >
            {displayStatus.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatCurrency(invoice.total)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatCurrency(invoice.paidAmount)}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("fr-FR")
            : "\u2014"}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {invoice.createdAt
            ? new Date(invoice.createdAt).toLocaleDateString("fr-FR")
            : "\u2014"}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {invoice.isEstimate && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isMutating}
                onClick={(e) => onConvertEstimate(e, invoice.id)}
                title="Convertir en facture"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            {!invoice.isEstimate && invoice.status === "draft" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isMutating}
                onClick={(e) => onStatusChange(e, invoice.id, "sent")}
                title="Marquer comme envoyé"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
            {!invoice.isEstimate &&
              (invoice.status === "sent" || invoice.status === "overdue") && (
                <>
                  {invoice.status === "sent" ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isMutating}
                      onClick={(e) => onStatusChange(e, invoice.id, "sent")}
                      title="Marquer comme envoyé"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isMutating}
                    onClick={(e) => onStatusChange(e, invoice.id, "paid")}
                    title="Marquer comme payé"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border last:border-0">
          <td colSpan={9} className="bg-muted/20 px-8 py-4">
            {detail.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des détails de la facture...
              </div>
            ) : detail.data ? (
              <div className="space-y-4">
                {/* Estimate Approval Card */}
                {invoice.isEstimate && (
                  <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Ceci est un devis
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const d = detail.data!;
                          const clientName = [d.clientFirstName, d.clientLastName]
                            .filter(Boolean)
                            .join(" ");
                          generateInvoicePdf({
                            practiceName: "Your Practice",
                            clientName,
                            clientEmail: d.clientEmail ?? undefined,
                            patientName: d.patientName ?? undefined,
                            invoiceDate: d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString("fr-FR")
                              : new Date().toLocaleDateString("fr-FR"),
                            dueDate: d.dueDate
                              ? new Date(d.dueDate).toLocaleDateString("fr-FR")
                              : undefined,
                            status: "estimate",
                            items: d.items.map((item) => ({
                              description: item.description ?? "",
                              quantity: Number(item.quantity ?? 1),
                              unitPrice: formatCurrency(item.unitPrice),
                              total: formatCurrency(item.total),
                            })),
                            subtotal: formatCurrency(d.subtotal),
                            tax: formatCurrency(d.tax),
                            total: formatCurrency(d.total),
                            paidAmount: formatCurrency(d.paidAmount),
                          }).save(`estimate-${clientName || "unknown"}.pdf`);
                        }}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Présenter au client
                      </Button>
                      <Button
                        size="sm"
                        disabled={isMutating}
                        onClick={(e) => onConvertEstimate(e, invoice.id)}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Approuver et convertir
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">
                    Client :{" "}
                    <span className="text-foreground font-medium">
                      {detail.data.clientFirstName}{" "}
                      {detail.data.clientLastName}
                    </span>
                  </span>
                  {detail.data.clientEmail && (
                    <span className="text-muted-foreground">
                      {detail.data.clientEmail}
                    </span>
                  )}
                </div>
                {detail.data.items.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="py-2 text-left font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Qté
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Prix unitaire
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.data.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 capitalize text-muted-foreground">
                            {item.itemType}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={4} className="py-2 text-right font-medium">
                          Sous-total
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatCurrency(detail.data.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="py-1 text-right text-muted-foreground">
                          Taxes
                        </td>
                        <td className="py-1 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(detail.data.tax)}
                        </td>
                      </tr>
                      <tr className="font-semibold">
                        <td colSpan={4} className="py-2 text-right">
                          Total
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatCurrency(detail.data.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No line items on this invoice.
                  </p>
                )}

                {/* Balance Summary */}
                {!invoice.isEstimate && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                    <div className="flex items-center gap-6">
                      <span>
                        Total: <span className="font-semibold">{formatCurrency(detail.data.total)}</span>
                      </span>
                      <span>
                        Paid: <span className="font-semibold text-green-600">{formatCurrency(detail.data.paidAmount)}</span>
                      </span>
                      <span>
                        Balance:{" "}
                        <span className="font-semibold text-red-600">
                          {formatCurrency(
                            Number(detail.data.total ?? 0) -
                              Number(detail.data.paidAmount ?? 0)
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const d = detail.data!;
                          const clientName = [d.clientFirstName, d.clientLastName]
                            .filter(Boolean)
                            .join(" ");
                          generateInvoicePdf({
                            practiceName: "Your Practice",
                            clientName,
                            clientEmail: d.clientEmail ?? undefined,
                            patientName: d.patientName ?? undefined,
                            invoiceDate: d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString("fr-FR")
                              : new Date().toLocaleDateString("fr-FR"),
                            dueDate: d.dueDate
                              ? new Date(d.dueDate).toLocaleDateString("fr-FR")
                              : undefined,
                            status: d.status,
                            items: d.items.map((item) => ({
                              description: item.description ?? "",
                              quantity: Number(item.quantity ?? 1),
                              unitPrice: formatCurrency(item.unitPrice),
                              total: formatCurrency(item.total),
                            })),
                            subtotal: formatCurrency(d.subtotal),
                            tax: formatCurrency(d.tax),
                            total: formatCurrency(d.total),
                            paidAmount: formatCurrency(d.paidAmount),
                          }).save(`invoice-${clientName || "unknown"}.pdf`);
                        }}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Télécharger le PDF
                      </Button>
                      <EmailInvoiceButton invoiceId={invoice.id} />
                    </div>
                  </div>
                )}

                {/* Payment History & Record Payment */}
                {!invoice.isEstimate && (
                  <PaymentSection
                    invoiceId={invoice.id}
                    invoiceTotal={detail.data.total}
                    invoicePaidAmount={detail.data.paidAmount}
                    invoiceStatus={invoice.status}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Échec du chargement des détails de la facture.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function EmailInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const sendInvoiceEmail = trpc.notifications.sendInvoiceEmail.useMutation({
    onSuccess: () => {
      toast.success("Facture envoyée par e-mail");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={sendInvoiceEmail.isPending}
      onClick={(e) => {
        e.stopPropagation();
        sendInvoiceEmail.mutate({ invoiceId });
      }}
    >
      {sendInvoiceEmail.isPending ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Mail className="mr-1 h-3.5 w-3.5" />
      )}
      Envoyer la facture
    </Button>
  );
}

function PaymentSection({
  invoiceId,
  invoiceTotal,
  invoicePaidAmount,
  invoiceStatus,
}: {
  invoiceId: string;
  invoiceTotal: string | null;
  invoicePaidAmount: string | null;
  invoiceStatus: string;
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  const utils = trpc.useUtils();

  const paymentsQuery = trpc.billing.listPayments.useQuery({ invoiceId });

  const recordPayment = trpc.billing.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("Paiement enregistré");
      utils.billing.listPayments.invalidate({ invoiceId });
      utils.billing.listInvoices.invalidate();
      utils.billing.getInvoice.invalidate({ id: invoiceId });
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const remaining = Math.max(
    0,
    Number(invoiceTotal ?? 0) - Number(invoicePaidAmount ?? 0)
  );

  const handleOpenForm = () => {
    setPaymentAmount(remaining.toFixed(2));
    setShowPaymentForm(true);
  };

  const handleRecordPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    recordPayment.mutate({
      invoiceId,
      amount: paymentAmount,
      method: paymentMethod as any,
      notes: paymentNotes || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Historique des paiements</h4>
        {invoiceStatus !== "paid" && remaining > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenForm}
          >
            <DollarSign className="mr-1 h-3.5 w-3.5" />
            Enregistrer le paiement
          </Button>
        )}
      </div>

      {/* Payment form */}
      {showPaymentForm && (
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Montant
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining.toString()}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Méthode
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Notes (facultatif)
              </label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Référence, chèque n°, etc."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRecordPayment}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                recordPayment.isPending
              }
            >
              {recordPayment.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPaymentForm(false)}
            >
              Annuler
            </Button>
          </div>
          {recordPayment.isError && (
            <p className="text-xs text-destructive">
              {recordPayment.error.message}
            </p>
          )}
        </div>
      )}

      {/* Payment list */}
      {paymentsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement des paiements...</p>
      ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="py-2 text-right font-medium text-muted-foreground">
                Montant
              </th>
              <th className="py-2 text-left font-medium text-muted-foreground">
                Méthode
              </th>
              <th className="py-2 text-left font-medium text-muted-foreground">
                Reçu par
              </th>
              <th className="py-2 text-left font-medium text-muted-foreground">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentsQuery.data.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-2 text-muted-foreground">
                  {payment.receivedAt
                    ? new Date(payment.receivedAt).toLocaleDateString("fr-FR")
                    : "\u2014"}
                </td>
                <td className="py-2 text-right tabular-nums font-medium text-green-600">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="py-2 capitalize text-muted-foreground">
                  {payment.method?.replace(/_/g, " ") ?? "\u2014"}
                </td>
                <td className="py-2 text-muted-foreground">
                  {payment.receivedByName ?? "\u2014"}
                </td>
                <td className="py-2 text-muted-foreground">
                  {payment.notes || "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-muted-foreground">Aucun paiement enregistré.</p>
      )}
    </div>
  );
}
