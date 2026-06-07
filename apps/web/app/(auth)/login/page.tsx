"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEMO_ROLES = [
  {
    label: "Administrateur",
    description: "Accès complet — tout ce qu'un propriétaire de clinique voit",
    email: "admin@clinique-alger.vetdz.dz",
    password: "password123",
  },
  {
    label: "Vétérinaire",
    description: "Salle d'examen, notes SOAP, prescriptions",
    email: "yacine.benyahia@clinique-alger.vetdz.dz",
    password: "password123",
  },
  {
    label: "Technicien",
    description: "Soins, flux de laboratoire, tableau blanc",
    email: "karim.haddad@clinique-alger.vetdz.dz",
    password: "password123",
  },
  {
    label: "Accueil",
    description: "Planification, accueil, facturation",
    email: "fatima.saidi@clinique-alger.vetdz.dz",
    password: "password123",
  },
];

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWith(emailValue: string, passwordValue: string) {
    setError("");
    setLoading(true);
    setEmail(emailValue);
    setPassword(passwordValue);

    const result = await signIn("credentials", {
      email: emailValue,
      password: passwordValue,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWith(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">VetDZ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Se connecter à votre clinique
          </p>
        </div>

        {DEMO_MODE && (
          <div className="mb-6 rounded-md border border-primary/20 bg-primary/5 p-4">
            <p className="mb-1 text-sm font-semibold text-foreground">
              Essayez la démo — un clic pour se connecter
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Vous êtes dans la démo en direct de VetDZ. Choisissez un rôle pour vous connecter instantanément.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ROLES.map((role) => (
                <button
                  key={role.email}
                  type="button"
                  onClick={() => signInWith(role.email, role.password)}
                  disabled={loading}
                  className="group flex flex-col rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    Se connecter en tant que {role.label}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {role.description}
                  </span>
                </button>
              ))}
            </div>
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none hover:text-foreground">
                Voir les identifiants
              </summary>
              <div className="mt-2 space-y-1 rounded border border-border bg-background p-2 font-mono">
                {DEMO_ROLES.map((role) => (
                  <div key={role.email} className="flex justify-between gap-2">
                    <span className="truncate">{role.email}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {role.password}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@clinic.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Créer votre clinique
          </Link>
        </p>
      </div>
    </div>
  );
}
