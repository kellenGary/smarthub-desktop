'use client'

import ConnectionStatus from "./connectionStatus";
import {redirect, usePathname} from "next/navigation";
import React, { useEffect, useState } from "react";
import ControlPanel from "./controlPanel";
import FlagConsole from "./flagConsole";
import Link from "next/link";
import { useFlagging } from "../context/flaggingContext";

export default function NavbarRecording() {
    const pathname = usePathname();
    const [show, setShow] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [recording, setRecording] = useState(pathname === "/recorder/");
    const { flagging, handleFlagging } = useFlagging();
    const [recordingState, setRecordingState] = useState({
        isRecording: false,
        startTime: null
    });
    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        setRecording(pathname === "/recorder");
    }, [pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setShow(window.scrollY <= lastScrollY);
            setLastScrollY(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [lastScrollY]);

    // Add timer effect for continuous updates
    useEffect(() => {
        let timerInterval;

        if (recordingState.isRecording && recordingState.startTime) {
            // Update the time every 100ms
            timerInterval = setInterval(() => {
                const elapsedTime = (Date.now() - recordingState.startTime) / 1000;
                setRecordingTime(elapsedTime);
            }, 100);
        }

        return () => {
            if (timerInterval) clearInterval(timerInterval);
        };
    }, [recordingState.isRecording, recordingState.startTime]);

    function handleEndRecording() {
        if (window.electronAPI) {
            window.electronAPI.endTest();
        }
    }

    // Define event handlers
    const handleRestartRecording = (eventData) => {
        console.log("Restart recording handler triggered", eventData);
        setRecordingTime(0); // Reset time only on restart

        if (eventData && eventData.startTime) {
            setRecordingState({
                isRecording: true,
                startTime: eventData.startTime
            });
        }
    };

    const handleBeginReading = (eventData) => {
        console.log("Begin reading handler triggered", eventData);
        if (eventData && eventData.startTime) {
            setRecordingState({
                isRecording: true,
                startTime: eventData.startTime
            });
        }
    };

    const handleStopReading = () => {
        console.log("Stop reading handler triggered");
        // Keep the final time when stopped
        setRecordingState({
            isRecording: false,
            startTime: null
        });
        // No need to calculate final time here as it's continuously updated by the timer effect
    };

    // Set up and clean up IPC listeners
    useEffect(() => {
        if (!window.electronAPI) return;

        // Register event listeners and store the returned cleanup functions
        const restartListener = window.electronAPI.onRestartRecording(handleRestartRecording);
        const beginListener = window.electronAPI.onBeginReading(handleBeginReading);
        const stopListener = window.electronAPI.onStopReading(handleStopReading);

        // Get initial recording state
        const initRecordingState = async () => {
            if (window.electronAPI.getRecordingState) {
                const state = await window.electronAPI.getRecordingState();
                setRecordingState(state);
            }
        };

        initRecordingState();

        // Clean up function to remove listeners when component unmounts
        return () => {
            if (window.electronAPI) {
                // Use the returned cleanup functions from the listeners
                restartListener && restartListener();
                beginListener && beginListener();
                stopListener && stopListener();
            }
        };
    }, []);

    return (
        <>
            <div className={`sticky flex flex-row-reverse top-0 z-5 w-[100%] h-[10vh]
            ${show ? "opacity-100" : "opacity-0"} transition`}>

                <div className={`p-2 text-right ${flagging && ('opacity-0')} transition`}>
                    <p className="font-bold text-[3vw] tracking-[0.3rem] leading-tight cursor-pointer">SMARTHUB</p>
                    <p className="text-[2vw] tracking-[0.5rem] leading-[1.2rem] pb-4 cursor-pointer">RECORDER</p>
                </div>

                {recording && (
                    <div className="flex flex-row grow gap-6 justify-center p-4 items-center ">
                        <ConnectionStatus/>
                        <ControlPanel setFlagging={handleFlagging} flagging={flagging}/>

                        <div className="flex bg-[#0a0a0a] items-center justify-center h-full rounded-lg px-6 py-2 ">
                            {recordingState.isRecording ? (
                                <div className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                                    <span className="text-sm font-medium">
                                        Recording: {recordingTime.toFixed(1)}s
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center text-gray-400">
                                    <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                                    <span className="text-sm font-medium">
                                        {recordingTime.toFixed(1) > 0 ? ("Not Recording " + recordingTime.toFixed(1) + "s") : ("Not recording")}
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
            {flagging && (
                <FlagConsole setFlagging={handleFlagging}/>
            )}
        </>
    );
}