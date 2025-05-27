import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  return (
      <header className="w-full py-4 px-6 bg-hive-background/95 backdrop-blur-sm border-b border-hive-accent/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
                src="/lovable-uploads/997f6de6-fdf7-4b4c-a447-9e5b0783fab9.png"
                alt="Hive Logo"
                className="h-10 w-auto"
            />
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Button
                    variant="outline"
                    className="border-hive-primary text-hive-primary hover:bg-hive-primary hover:text-white transition-all duration-300"
                    onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                    className="bg-hive-primary hover:bg-hive-secondary text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                    onClick={() => navigate("/register")}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                <span className="text-hive-primary font-medium">Welcome, {user?.username}</span>
                <Button
                  variant="outline"
                  className="border-hive-primary text-hive-primary hover:bg-hive-primary hover:text-white transition-all duration-300"
                  onClick={logout}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
  );
};

export default Header;