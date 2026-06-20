"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const speciesOptions = [
  { value: "canine", label: "Canin" },
  { value: "feline", label: "Félin" },
  { value: "avian", label: "Aviaire" },
  { value: "rabbit", label: "Lapin" },
  { value: "reptile", label: "Reptile" },
  { value: "equine", label: "Équine" },
  { value: "other", label: "Autre" },
] as const;

const sexOptions = [
  { value: "male", label: "Mâle (non castré)" },
  { value: "female", label: "Femelle (non stérilisée)" },
  { value: "male_neutered", label: "Mâle (castré)" },
  { value: "female_spayed", label: "Femelle (stérilisée)" },
] as const;

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    species: "canine" as string,
    breed: "",
    sex: "" as string,
    dob: "",
    color: "",
    microchipNumber: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: clientResults } = trpc.clients.search.useQuery(
    { query: clientSearch },
    { enabled: clientSearch.length >= 1 }
  );

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Patient créé");
      router.push("/patients");
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.clientId) {
      setError("Sélectionnez un propriétaire (client).");
      return;
    }
    if (!form.name.trim()) {
      setError("Le nom du patient est requis.");
      return;
    }

    createPatient.mutate({
      clientId: form.clientId,
      name: form.name.trim(),
      species: form.species as any,
      breed: form.breed.trim() || undefined,
      sex: form.sex ? (form.sex as any) : undefined,
      dob: form.dob || undefined,
      color: form.color.trim() || undefined,
      microchipNumber: form.microchipNumber.trim() || undefined,
    });
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectClient = (client: {
    id: string;
    firstName: string;
    lastName: string;
  }) => {
    setForm((prev) => ({ ...prev, clientId: client.id }));
    setSelectedClientName(`${client.firstName} ${client.lastName}`);
    setClientSearch("");
    setShowClientDropdown(false);
  };

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/patients")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux patients
      </Button>

      <h2 className="font-heading text-xl font-semibold">Nouveau patient</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajouter un nouveau dossier patient
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Client Search */}
        <div>
          <label className="text-sm font-medium">Propriétaire (client) *</label>
          {selectedClientName ? (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex h-10 flex-1 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                {selectedClientName}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm((prev) => ({ ...prev, clientId: "" }));
                  setSelectedClientName("");
                }}
              >
                Modifier
              </Button>
            </div>
          ) : (
            <div className="relative mt-1">
              <Input
                placeholder="Rechercher des clients par nom ou email..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowClientDropdown(false), 200);
                }}
              />
              {showClientDropdown &&
                clientResults &&
                clientResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                    {clientResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 first:rounded-t-md last:rounded-b-md"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectClient(client)}
                      >
                        <span className="font-medium">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="text-muted-foreground">
                          {client.email || client.phone || ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              {showClientDropdown &&
                clientSearch.length >= 1 &&
                clientResults &&
                clientResults.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card p-3 text-center text-sm text-muted-foreground shadow-lg">
                    Aucun client trouvé
                  </div>
                )}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Nom du patient *
          </label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Nom du patient"
            className="mt-1"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="species">
              Espèce *
            </label>
            <select
              id="species"
              value={form.species}
              onChange={(e) => updateField("species", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {speciesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="breed">
              Race
            </label>
            <Input
              id="breed"
              value={form.breed}
              onChange={(e) => updateField("breed", e.target.value)}
              placeholder="Race"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="sex">
              Sexe
            </label>
            <select
              id="sex"
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sélectionner le sexe...</option>
              {sexOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="dob">
              Date de naissance
            </label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="color">
              Couleur / Marquages
            </label>
            <Input
              id="color"
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="ex. noir et blanc"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="microchipNumber">
              Numéro de puce
            </label>
            <Input
              id="microchipNumber"
              value={form.microchipNumber}
              onChange={(e) => updateField("microchipNumber", e.target.value)}
              placeholder="Numéro de puce électronique"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={createPatient.isPending}>
            {createPatient.isPending ? "Création..." : "Créer le patient"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/patients")}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
