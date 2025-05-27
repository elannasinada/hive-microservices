import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
    const features = [
        {
            title: "Task Management",
            description: "Create, assign, and track tasks with intuitive drag-and-drop interfaces. Set priorities, deadlines, and dependencies to keep your team on track.",
            icon: "📋"
        },
        {
            title: "Project Tracking",
            description: "Monitor project progress in real-time with comprehensive dashboards, Gantt charts, and automated reporting features.",
            icon: "📊"
        },
        {
            title: "Team Collaboration",
            description: "Foster seamless communication with built-in chat, file sharing, and collaborative workspaces designed for remote and hybrid teams.",
            icon: "👥"
        },
        {
            title: "Time Tracking",
            description: "Track time spent on tasks and projects automatically. Generate detailed reports for billing, productivity analysis, and resource planning.",
            icon: "⏰"
        },
        {
            title: "Resource Management",
            description: "Allocate resources efficiently with workload balancing, capacity planning, and skill-based assignment recommendations.",
            icon: "⚡"
        },
        {
            title: "Analytics & Insights",
            description: "Make data-driven decisions with advanced analytics, performance metrics, and customizable reporting dashboards.",
            icon: "📈"
        }
    ];

    return (
        <section className="py-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-hive-primary mb-6">
                        Everything You Need to Succeed
                    </h2>
                    <p className="text-xl text-hive-primary/70 max-w-3xl mx-auto">
                        Powerful features designed to streamline your workflow and boost productivity across your entire organization.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="feature-card border-hive-accent/20 hover:border-hive-accent/40 bg-gradient-to-br from-white to-hive-background/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-hive-accent"
                            >
                            <CardHeader className="text-center">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <CardTitle className="text-xl font-bold text-hive-primary mb-2">
                                    {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-hive-primary/70 text-center leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
