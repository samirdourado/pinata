"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { loginSchema, registrationSchema } from "@/utils/authStore";

type AuthMode = "login" | "register";
type AuthFields = {
  displayName: string;
  username: string;
  email: string;
  bio: string;
  identifier: string;
  password: string;
  confirmPassword: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { login, register } = useAuth();
  const [fields, setFields] = useState<AuthFields>({
    displayName: "",
    username: "",
    email: "",
    bio: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: keyof AuthFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setErrors({});

    if (isRegister) {
      const result = registrationSchema.safeParse(fields);
      if (!result.success) {
        setErrors(
          Object.fromEntries(
            result.error.issues.map((issue) => [
              String(issue.path[0]),
              issue.message,
            ]),
          ),
        );
        return;
      }

      setIsSubmitting(true);
      try {
        await register(result.data);
        router.replace("/");
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Unable to create your account.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = loginSchema.safeParse({
      identifier: fields.identifier,
      password: fields.password,
    });
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "mt-1.5 w-full rounded-xl border border-card-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-card-border bg-card shadow-xl shadow-slate-900/5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-slate-950 p-7 text-white sm:p-10 lg:min-h-170">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-44 border-pink-500/15" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-44 border-emerald-400/15" />
          <Link
            href="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <Image src="/pinataA.png" alt="" width={42} height={42} />
            <span className="text-xl font-black">Pinata</span>
          </Link>
          <div className="relative z-10 max-w-md py-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-300">
              SocialFi for meaningful participation
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Better conversations. Shared rewards.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Join a community where useful contributions help creators and
              bring participants closer to the Piñata rewards.
            </p>
          </div>
          <p className="relative z-10 text-xs text-slate-400">
            Prototype experience · Connect a Solana wallet after signing in
          </p>
        </aside>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold text-primary">
                {isRegister ? "Create your account" : "Welcome back"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-foreground">
                {isRegister ? "Join Pinata" : "Sign in to Pinata"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {isRegister
                  ? "Set up your profile to take part in the community."
                  : "Use your email address or username to continue."}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isRegister ? (
                <>
                  <div>
                    <label
                      htmlFor="displayName"
                      className="text-sm font-semibold text-foreground"
                    >
                      Display name
                    </label>
                    <input
                      id="displayName"
                      autoComplete="name"
                      value={fields.displayName}
                      onChange={(event) =>
                        updateField("displayName", event.target.value)
                      }
                      className={inputClassName}
                      aria-invalid={Boolean(errors.displayName)}
                      aria-describedby={
                        errors.displayName ? "displayName-error" : undefined
                      }
                    />
                    {errors.displayName && (
                      <p
                        id="displayName-error"
                        className="mt-1 text-xs text-red-600"
                      >
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="text-sm font-semibold text-foreground"
                    >
                      Username
                    </label>
                    <div className="mt-1.5 flex items-center rounded-xl border border-card-border bg-background px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                      <span className="text-sm text-muted">@</span>
                      <input
                        id="username"
                        autoComplete="username"
                        maxLength={20}
                        value={fields.username}
                        onChange={(event) =>
                          updateField("username", event.target.value)
                        }
                        className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={
                          errors.username ? "username-error" : undefined
                        }
                      />
                    </div>
                    {errors.username && (
                      <p
                        id="username-error"
                        className="mt-1 text-xs text-red-600"
                      >
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={fields.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      className={inputClassName}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-xs text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="text-sm font-semibold text-foreground"
                    >
                      Bio{" "}
                      <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      id="bio"
                      rows={2}
                      maxLength={160}
                      value={fields.bio}
                      onChange={(event) =>
                        updateField("bio", event.target.value)
                      }
                      className={`${inputClassName} resize-y`}
                      aria-invalid={Boolean(errors.bio)}
                      aria-describedby={errors.bio ? "bio-error" : undefined}
                    />
                    {errors.bio && (
                      <p id="bio-error" className="mt-1 text-xs text-red-600">
                        {errors.bio}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label
                    htmlFor="identifier"
                    className="text-sm font-semibold text-foreground"
                  >
                    Email or username
                  </label>
                  <input
                    id="identifier"
                    autoComplete="username"
                    value={fields.identifier}
                    onChange={(event) =>
                      updateField("identifier", event.target.value)
                    }
                    className={inputClassName}
                    aria-invalid={Boolean(errors.identifier)}
                    aria-describedby={
                      errors.identifier ? "identifier-error" : undefined
                    }
                  />
                  {errors.identifier && (
                    <p
                      id="identifier-error"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.identifier}
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Password
                  </label>
                  <span className="text-xs text-muted">6–12 characters</span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={6}
                    maxLength={12}
                    value={fields.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    className={`${inputClassName} pr-16`}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {isRegister && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-foreground"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={12}
                    value={fields.confirmPassword}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    className={inputClassName}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                  />
                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {isRegister ? "Already have an account?" : "New to Pinata?"}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-bold text-primary hover:underline"
              >
                {isRegister ? "Sign in" : "Create an account"}
              </Link>
            </p>
            <p className="mt-5 text-center text-xs leading-5 text-muted">
              Prototype account data stays in this browser. After signing in,
              you can connect a Solana wallet such as Phantom or Solflare.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
