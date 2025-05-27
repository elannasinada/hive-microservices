import { Button } from "@/components/ui/button";

const CTA = () => {
    return (
        <section className="py-20 px-6 bg-hive-primary">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Ready to Transform Your Project Management?
                </h2>
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Join thousands of teams who have revolutionized their workflow with Hive.
                    Start your free trial today and experience the difference.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        size="lg"
                        className="bg-white text-hive-primary hover:bg-hive-accent hover:text-hive-primary px-8 py-4 text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                        Start Free Trial
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="bg-white text-hive-primary hover:bg-hive-accent hover:text-hive-primary px-8 py-4 text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                        Contact Sales
                    </Button>
                </div>

                <p className="text-white/70 text-sm mt-6">
                    No credit card required • 14-day free trial • Cancel anytime
                </p>
            </div>
        </section>
    );
};

export default CTA;
