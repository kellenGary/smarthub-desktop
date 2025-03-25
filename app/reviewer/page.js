'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useFetchFlags from '../hooks/useFetchFlags';
import { FiDownload, FiSave, FiArrowLeft, FiFileText } from 'react-icons/fi';
import ReviewerChart from "./reviewerChart";

export default function Page() {
    const router = useRouter();
    const [testData, setTestData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [testName, setTestName] = useState('');
    const [testDistance, setTestDistance] = useState('');
    const [unitType, setUnitType] = useState('m');
    const [comments, setComments] = useState('');
    const [allFlags] = useFetchFlags();
    const [activeChartTab, setActiveChartTab] = useState('displacement');

    useEffect(() => {
        // Simulate fetching test data
        const fetchTestData = async () => {
            if (window.electronAPI) {
                try {
                    const response = await window.electronAPI.getTestData();
                    setTestData(response);
                } catch (error) {
                    console.error('Error fetching test data:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // For development without electron
                setIsLoading(false);
            }
        };

        fetchTestData();
    }, []);

    const handleDownloadCSV = async () => {
        if (!window.electronAPI) return;

        try {
            await window.electronAPI.downloadCSV({
                testData,
                testName,
                testDistance: `${testDistance}${unitType}`,
                comments,
                flags: allFlags
            });
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    };

    const handleSaveTest = async () => {
        if (!window.electronAPI) return;

        try {
            await window.electronAPI.saveTestData({
                testData,
                testName,
                testDistance: `${testDistance}${unitType}`,
                comments,
                flags: allFlags
            });

            // Show success notification
            alert('Test saved successfully');
        } catch (error) {
            console.error('Error saving test:', error);
            alert('Failed to save test');
        }
    };

    const renderChartContent = () => {
        if (!testData) return <div className="p-8 text-center">No data available</div>;

        return (
            <>
                {activeChartTab === 'displacement' && (
                    <ReviewerChart
                        data={testData.displacement}
                        title="Displacement vs Time"
                        graphId={1}
                    />
                )}
                {activeChartTab === 'heading' && (
                    <ReviewerChart
                        data={testData.heading}
                        title="Heading vs Time"
                        graphId={2}
                    />
                )}
                {activeChartTab === 'velocity' && (
                    <ReviewerChart
                        data={testData.velocity}
                        title="Velocity vs Time"
                        graphId={3}
                    />
                )}
                {activeChartTab === 'trajectory' && (
                    <ReviewerChart
                        data={testData.trajectory}
                        title="Trajectory"
                        graphId={4}
                    />
                )}
            </>
        );
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col text-white p-6 overflow-y-auto">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.push('/recorder/')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold">Review Test</h1>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadCSV}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FiDownload /> Download CSV
                    </button>
                    <button
                        onClick={handleSaveTest}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FiSave /> Save Test
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Charts and Flag data */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Chart tabs and visualization */}
                    <div className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden">
                        <div className="flex border-b border-gray-800">
                            <button
                                className={`px-4 py-3 flex-1 ${activeChartTab === 'displacement' ? 'bg-blue-600 text-white' : 'hover:bg-[#252525]'}`}
                                onClick={() => setActiveChartTab('displacement')}
                            >
                                Displacement
                            </button>
                            <button
                                className={`px-4 py-3 flex-1 ${activeChartTab === 'heading' ? 'bg-blue-600 text-white' : 'hover:bg-[#252525]'}`}
                                onClick={() => setActiveChartTab('heading')}
                            >
                                Heading
                            </button>
                            <button
                                className={`px-4 py-3 flex-1 ${activeChartTab === 'velocity' ? 'bg-blue-600 text-white' : 'hover:bg-[#252525]'}`}
                                onClick={() => setActiveChartTab('velocity')}
                            >
                                Velocity
                            </button>
                            <button
                                className={`px-4 py-3 flex-1 ${activeChartTab === 'trajectory' ? 'bg-blue-600 text-white' : 'hover:bg-[#252525]'}`}
                                onClick={() => setActiveChartTab('trajectory')}
                            >
                                Trajectory
                            </button>
                        </div>

                        <div className="h-[400px] p-4">
                            {renderChartContent()}
                        </div>
                    </div>

                    {/* Flags section */}
                    <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="mr-2">Test Flags</span>
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                {allFlags?.length || 0}
                            </span>
                        </h2>

                        <div className="max-h-[300px] overflow-y-auto pr-2">
                            {allFlags && allFlags.length > 0 ? (
                                <div className="space-y-3">
                                    {allFlags.map(flag => (
                                        <div key={flag.id} className="bg-[#252525] p-3 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-400">
                                                    {flag.timestamp}
                                                </span>
                                                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                                                    Graph: {
                                                    flag.graphId === 1 ? 'Displacement' :
                                                        flag.graphId === 2 ? 'Heading' :
                                                            flag.graphId === 3 ? 'Velocity' :
                                                                flag.graphId === 4 ? 'Trajectory' : 'Unknown'
                                                }
                                                </span>
                                            </div>
                                            <p className="text-white">{flag.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    No flags were added during this test.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side - Metadata and submission forms */}
                <div className="space-y-6">
                    {/* Test name */}
                    <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FiFileText className="mr-2" /> Test Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">
                                    Test Name
                                </label>
                                <input
                                    type="text"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    placeholder="Enter a name for this test"
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">
                                    Test Distance
                                </label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        value={testDistance}
                                        onChange={(e) => setTestDistance(e.target.value)}
                                        placeholder="Distance"
                                        className="flex-1 bg-[#252525] border border-gray-700 rounded-l-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <select
                                        value={unitType}
                                        onChange={(e) => setUnitType(e.target.value)}
                                        className="bg-[#333333] border border-gray-700 rounded-r-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="m">m</option>
                                        <option value="ft">ft</option>
                                        <option value="km">km</option>
                                        <option value="mi">mi</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">
                                    Test Date
                                </label>
                                <div className="w-full bg-[#252525] border border-gray-700 rounded-lg p-3 text-white">
                                    {new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">
                                    Additional Comments
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Enter any additional comments or observations"
                                    className="w-full bg-[#252525] border border-gray-700 rounded-lg p-3 text-white min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test metrics summary */}
                    <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Test Metrics</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#252525] p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Duration</p>
                                <p className="text-xl font-semibold">
                                    {testData?.duration || '--'} sec
                                </p>
                            </div>
                            <div className="bg-[#252525] p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Max Velocity</p>
                                <p className="text-xl font-semibold">
                                    {testData?.maxVelocity?.toFixed(2) || '--'} m/s
                                </p>
                            </div>
                            <div className="bg-[#252525] p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Data Points</p>
                                <p className="text-xl font-semibold">
                                    {testData?.sensorData?.length || '--'}
                                </p>
                            </div>
                            <div className="bg-[#252525] p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Avg. Heading</p>
                                <p className="text-xl font-semibold">
                                    {testData?.avgHeading?.toFixed(2) || '--'}°
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}