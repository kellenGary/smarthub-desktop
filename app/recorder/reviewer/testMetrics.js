import {useTest} from "../context/testContext";

// Component for specific test metrics
export default function TestMetrics() {
    const { testData } = useTest()

    return (
        <div className="bg-surface-50 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Metrics</h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-500">
                    <p className="opacity-50 text-sm">Duration</p>
                    <p className="text-xl font-semibold">
                        {testData?.duration || '--'} sec
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-500">
                    <p className="opacity-50 text-sm">Max Velocity</p>
                    <p className="text-xl font-semibold">
                        {testData?.maxVelocity?.toFixed(2) || '--'} m/s
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-500">
                    <p className="opacity-50 text-sm">Data Points</p>
                    <p className="text-xl font-semibold">
                        {testData.displacement.length * 4 || '--'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-500">
                    <p className="opacity-50 text-sm">Avg. Heading</p>
                    <p className="text-xl font-semibold">
                        {testData?.avgHeading?.toFixed(2) || '--'}°
                    </p>
                </div>
            </div>
        </div>
    )
}