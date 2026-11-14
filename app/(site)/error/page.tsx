import { LinkButton } from "@components/ui/link-button";

export default function ErrorPage() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-10">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gold">Oops!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sorry, something went wrong.</p>
        <LinkButton href="/" variant="outline" size="sm" className="mt-4">
          Return to Home
        </LinkButton>
      </div>
    </div>
  );
}
