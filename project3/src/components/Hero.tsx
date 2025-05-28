import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const Hero = () => {
    return (
        <section className="gradient-bg py-20 px-6">
            <div className="max-w-7xl mx-auto text-center">
                <div className="animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-bold text-hive-primary mb-6 leading-tight">
                        Manage Projects
                        <br />
                        <span className="text-hive-secondary">Like a Pro</span>
                    </h1>
                </div>

                <div className="animate-fade-in-up-delay-1">
                    <p className="text-xl md:text-2xl text-hive-primary/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Streamline your workflow, boost team collaboration, and deliver projects on time with Hive's powerful project management platform.
                    </p>
                </div>

                <div className="animate-fade-in-up-delay-2 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Button
                        size="lg"
                        className="bg-hive-primary hover:bg-hive-secondary text-white px-8 py-4 text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                        Get Started Free
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-hive-primary text-hive-primary hover:bg-hive-primary hover:text-white px-8 py-4 text-lg transition-all duration-300"
                    >
                        Watch Demo
                    </Button>
                </div>

                <div className="animate-fade-in-up-delay-3">
                    <ArrowDown className="mx-auto text-hive-accent animate-bounce" size={32} />
                </div>
            </div>
        </section>
    );
};

export default Hero;