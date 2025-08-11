import CountUp from "@/components/ui/CountUp";

export default function CountUpDemoPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">CountUp Component Demo</h1>
      
      <div className="space-y-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Basic Examples</h2>
          <div className="space-y-4">
            <p className="text-lg">
              Trusted by <CountUp to={10000} />+ founders
            </p>
            <p className="text-lg">
              Price: $<CountUp to={29.99} precision={2} /> USD
            </p>
            <p className="text-lg">
              Analysis in <CountUp to={60} /> seconds
            </p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Token Counts</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                <CountUp to={12} />
              </div>
              <div className="text-sm text-gray-600">tokens</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                <CountUp to={28} />
              </div>
              <div className="text-sm text-gray-600">tokens</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                <CountUp to={45} />
              </div>
              <div className="text-sm text-gray-600">tokens</div>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Custom Duration</h2>
          <div className="space-y-4">
            <p className="text-lg">
              Fast count: <CountUp to={1000} duration={0.5} />
            </p>
            <p className="text-lg">
              Slow count: <CountUp to={1000} duration={3.0} />
            </p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Precision Examples</h2>
          <div className="space-y-4">
            <p className="text-lg">
              Percentage: <CountUp to={95.7} precision={1} />%
            </p>
            <p className="text-lg">
              Currency: $<CountUp to={1234.56} precision={2} />
            </p>
            <p className="text-lg">
              Ratio: <CountUp to={3.14159} precision={4} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
