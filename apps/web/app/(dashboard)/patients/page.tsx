"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, PawPrint } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/common/loading";

const speciesEmoji: Record<string, string> = {
  canine: "\uD83D\uDC36",
  feline: "\uD83D\uDC31",
  avian: "\uD83D\uDC26",
  rabbit: "\uD83D\uDC30",
  reptile: "\uD83E\uDD8E",
  equine: "\uD83D\uDC34",
  other: "\uD83D\uDC3E",
};

const speciesOptions = [
    { value: "", label: "Toutes espèces" },
    { value: "canine", label: "Canin" },
    { value: "feline", label: "Félin" },
    { value: "avian", label: "Aviaire" },
    { value: "rabbit", label: "Lapin" },
    { value: "reptile", label: "Reptile" },
    { value: "equine", label: "Équine" },
    { value: "other", label: "Autre" },

function formatSex(sex: string | null): string {
  if (!sex) return "\u2014";
  const labels: Record<string, string> = {
    male: "M",
    female: "F",
    male_neutered: "MC",
    female_spayed: "FS",
  };
  return labels[sex] ?? sex;
}

function formatStatus(status: string | null): string {
  if (!status) return "";
  const labels: Record<string, string> = {
    active: "Actif",
    inactive: "Inactif",
    deceased: "Décédé",
  };
  return labels[status] ?? status;
}

export default function PatientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");

  const { data, isLoading, error } = trpc.patients.list.useQuery({
    search: search || undefined,
    species: species || undefined,
    limit: 25,
    offset: 0,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Patients</h2>
          <p className="text-sm text-muted-foreground">
            Gérer les dossiers patients
          </p>
        </div>
        <Button onClick={() => router.push("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Patient
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {speciesOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total} patient{data.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : data && data.items.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Nom
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Race
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Propriétaire
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Sexe
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    <span className="mr-1.5">
                      {speciesEmoji[patient.species ?? "other"] ?? "\uD83D\uDC3E"}
                    </span>
                    {patient.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {patient.breed || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {patient.clientFirstName && patient.clientLastName
                      ? `${patient.clientFirstName} ${patient.clientLastName}`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatSex(patient.sex)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        patient.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : patient.status === "deceased"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {formatStatus(patient.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <PawPrint className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            {search || species
              ? "Aucun patient ne correspond à vos filtres"
              : "Aucun patient pour le moment"}
          </p>
          {!search && !species && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/patients/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter votre premier patient
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
