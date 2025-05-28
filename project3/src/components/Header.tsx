import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";

const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <header className="border-b border-accent/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="flex items-center space-x-3">
                                <img
                                    src="/lovable-uploads/997f6de6-fdf7-4b4c-a447-9e5b0783fab9.png"
                                    alt="Hive Logo"
                                    className="h-10 w-auto"
                                />
                            </div>
                        </Link>

                        {isAuthenticated && (
                            <nav className="hidden md:flex space-x-6">
                                <Link
                                    to="/dashboard"
                                    className="text-secondary hover:text-primary transition-colors font-medium"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/tasks"
                                    className="text-secondary hover:text-primary transition-colors font-medium"
                                >
                                    Tasks
                                </Link>
                                {user?.roles.includes('ADMIN') && (
                                    <Link
                                        to="/admin"
                                        className="text-secondary hover:text-primary transition-colors font-medium"
                                    >
                                        Admin Panel
                                    </Link>
                                )}
                                {user?.roles.includes('PROJECT_LEADER') && (
                                    <Link
                                        to="/leader"
                                        className="text-secondary hover:text-primary transition-colors font-medium"
                                    >
                                        Project Leader
                                    </Link>
                                )}
                                <Link
                                    to="/team"
                                    className="text-secondary hover:text-primary transition-colors font-medium"
                                >
                                    Team
                                </Link>
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
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
                <span className="text-hive-primary font-medium hidden sm:inline">
                  Welcome, {user?.username}
                </span>

                                {/* Notifications */}
                                <Notifications />

                                {/* Profile Menu */}
                                <ProfileMenu />

                                <Button
                                    variant="outline"
                                    className="border-hive-primary text-hive-primary hover:bg-hive-primary hover:text-white transition-all duration-300 ml-2"
                                    onClick={logout}
                                >
                                    Logout
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;