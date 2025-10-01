'use client';

import { useState, useEffect } from 'react';
import TestFileCard from "./testFileCard";
import Link from "next/link";

export default function TestFileList({filters, searchTerm}) {
    const [testFiles, setTestFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const limit = 10;

    const fetchTestFiles = async (page = 1) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/db/tests?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setTestFiles(data.data || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching test files:', error);
            setTestFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestFiles(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const PaginationControls = () => {
        if (!pagination) return null;

        return (
            <div className="flex justify-center items-center gap-4 mt-6 p-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.has_previous}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                    Previous
                </button>
                
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">
                        Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <span className="text-gray-400 text-sm">
                        ({pagination.total_count} total tests)
                    </span>
                </div>
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                    Next
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            {(testFiles && testFiles.length > 0) ? (
                <div className="space-y-4">
                    <div className="space-y-4">
                        {testFiles.map((testFile, index) => (
                            <TestFileCard
                                key={testFile.id || index}
                                testFile={testFile}
                            />
                        ))}
                    </div>
                    <PaginationControls />
                </div>
            ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">No test files available.</p>
                    <Link
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
                        href={"/recorder"}
                    >
                        Create New Test
                    </Link>
                </div>
            )}
        </>
    )
}