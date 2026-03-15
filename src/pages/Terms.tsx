import React from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center text-white/40 hover:text-gold transition-colors mb-8 group">
                <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="uppercase tracking-widest text-xs">Back to Home</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-8 md:p-12 border border-white/10"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                        <Shield className="text-gold" size={24} />
                    </div>
                    <h1 className="text-3xl font-serif text-white">Terms & Conditions</h1>
                </div>

                <div className="space-y-8 text-white/80 leading-relaxed font-light">
                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">1.</span> Acceptance of Terms
                        </h2>
                        <p>
                            By accessing and using the Wine RWA website, you agree to comply with and be bound by these Terms and Conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">2.</span> Age Requirement
                        </h2>
                        <p>
                            You must be at least 18 years old to purchase alcoholic products from Wine RWA. By placing an order, you confirm that you meet the legal drinking age.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">3.</span> Orders
                        </h2>
                        <p>
                            All orders placed through the website are subject to confirmation and product availability. Wine RWA reserves the right to cancel or refuse any order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">4.</span> Pricing
                        </h2>
                        <p>
                            All prices are listed in Rwandan Francs (RWF). Prices may change without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">5.</span> Payments
                        </h2>
                        <p>
                            Payments are processed securely through PayPack mobile payment services. Wine RWA does not store any mobile money or payment credentials.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">6.</span> Delivery
                        </h2>
                        <p>
                            Delivery times may vary depending on the customer's location. Customers must provide accurate delivery details when placing an order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">7.</span> Returns and Refunds
                        </h2>
                        <p className="mb-2">Returns or refunds are only accepted if:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>The wrong product was delivered</li>
                            <li>The product was damaged during delivery</li>
                        </ul>
                        <p className="mt-4">
                            Requests for refunds must be made within 24 hours after receiving the order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">8.</span> Responsible Consumption
                        </h2>
                        <p>
                            Wine RWA promotes responsible drinking. Alcohol should be consumed responsibly and in accordance with local laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">9.</span> Changes to Terms
                        </h2>
                        <p>
                            Wine RWA reserves the right to update or modify these terms at any time without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-white mb-3 flex items-center">
                            <span className="text-gold mr-3">10.</span> Contact
                        </h2>
                        <p>
                            For any questions regarding these Terms & Conditions, please contact our support team through the website.
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}
