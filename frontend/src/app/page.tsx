import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">NeonHub</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="btn-primary">
                  Sign Up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Collaborate Efficiently with NeonHub
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  A modern platform for teams to work together on projects,
                  tasks, and documents in real-time.
                </p>
                <div className="flex space-x-4">
                  <Link href="/auth/register" className="btn-primary">
                    Get Started
                  </Link>
                  <Link href="#features" className="btn-outline">
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
                  {/* Placeholder for hero image */}
                  <span className="text-gray-500">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">
                  Project Management
                </h3>
                <p className="text-gray-600">
                  Create and manage projects with customizable workflows.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">
                  Real-time Collaboration
                </h3>
                <p className="text-gray-600">
                  Work together in real-time with instant updates.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Document Sharing</h3>
                <p className="text-gray-600">
                  Share and collaborate on documents within your workspace.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl font-bold mb-4">NeonHub</h2>
              <p className="text-gray-400 max-w-md">
                A modern collaboration platform designed to help teams work
                together efficiently.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/auth/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} NeonHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
