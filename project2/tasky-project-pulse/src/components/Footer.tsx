const Footer = () => {
    return (
        <footer className="py-12 px-6 bg-hive-secondary text-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src="/lovable-uploads/997f6de6-fdf7-4b4c-a447-9e5b0783fab9.png"
                                alt="Hive Logo"
                                className="h-8 w-auto brightness-0 invert"
                            />
                        </div>
                        <p className="text-white/80 max-w-md leading-relaxed">
                            Hive is the comprehensive project management solution that helps teams collaborate,
                            track progress, and deliver exceptional results.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-4">Product</h4>
                        <ul className="space-y-2 text-white/80">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-lg mb-4">Company</h4>
                        <ul className="space-y-2 text-white/80">
                            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/20 pt-8 text-center text-white/60">
                    <p>&copy; 2025 Hive. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;