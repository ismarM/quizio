import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    reason?: string;
  }> | {
    reason?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  return <LoginForm reason={resolvedSearchParams?.reason} />;
}
