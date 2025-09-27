import { DEPLOY_URL } from "@/app/lib/constants";
import HomeContent from "@/app/components/home/home-content";

export default async function Home() {
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/Authentica/authentica",
    {
      ...(process.env.GITHUB_OAUTH_TOKEN && {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
      // data will revalidate every 24 hours
      next: { revalidate: 86400 },
    },
  )
    .then((res) => res.json())
    .catch(() => ({ stargazers_count: 0 }));

  return (
    <HomeContent 
      stars={stars} 
      deployUrl={DEPLOY_URL}
    />
  );
}