// app/login/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/authOptions";
import LoginForm from "./components/LoginForm";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard"); // or whatever your protected route is
  }

  return (
    <div className="relative min-h-[98vh] flex items-center justify-center bg-gray-100 px-4 pt-16">
      <div className="absolute inset-0">
        <Image
          src="/background.jpeg"
          alt="Background"
          className="w-full h-full object-cover"
          width={50}
          height={50}
        />
        <div className="absolute inset-0 bg-blue-900 opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white shadow-md rounded-lg pt-24 pb-8 px-6">
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center border border-gray-300">
            <Image
              src="/synergy1.png"
              alt="Logo"
              className="w-24 h-24 object-contain"
              width={50}
              height={50}
            />
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
