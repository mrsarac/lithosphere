/**
 * LITHOSPHERE v7.0 - Geological Story Panel
 *
 * Joy Team Feature: UI for the geological story mode.
 * Shows formation timeline, controls, and narration.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { GeologicalStory, GeologicalKeyframe } from '../../../materials/types';
import type { StoryState } from './GeologicalStoryMode';
import './GeologicalStoryPanel.css';

// ============================================================================
// TYPES
// ============================================================================

interface GeologicalStoryPanelProps {
  story: GeologicalStory;
  state: StoryState;
  isOpen: boolean;
  onClose: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GeologicalStoryPanel: React.FC<GeologicalStoryPanelProps> = ({
  story,
  state,
  isOpen,
  onClose,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
}) => {
  const [speed, setSpeed] = useState(1);
  const progressRef = useRef<HTMLDivElement>(null);

  // Handle speed change
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      onSpeedChange(newSpeed);
    },
    [onSpeedChange]
  );

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const progress = (e.clientX - rect.left) / rect.width;
      onSeek(Math.max(0, Math.min(1, progress)));
    },
    [onSeek]
  );

  // Format time
  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="geological-story-panel">
      {/* Header */}
      <div className="story-header">
        <div className="story-icon">📜</div>
        <div className="story-title-section">
          <h2 className="story-title">{story.title}</h2>
          <span className="story-timescale">{story.timeScale}</span>
        </div>
        <button className="story-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Description */}
      <div className="story-description">
        <p>{story.description}</p>
        <div className="story-conditions">
          <span className="conditions-label">Formation Conditions:</span>
          <span className="conditions-value">{story.conditions}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="story-timeline">
        <div className="timeline-keyframes">
          {story.keyframes.map((keyframe, index) => (
            <div
              key={index}
              className={`timeline-keyframe ${
                index === state.currentKeyframeIndex ? 'active' : ''
              } ${state.progress >= keyframe.time ? 'passed' : ''}`}
              style={{ left: `${keyframe.time * 100}%` }}
              onClick={() => onSeek(keyframe.time)}
              title={keyframe.label}
            >
              <div className="keyframe-dot" />
              <span className="keyframe-label">{keyframe.label}</span>
            </div>
          ))}
        </div>

        <div
          ref={progressRef}
          className="timeline-progress-track"
          onClick={handleProgressClick}
        >
          <div
            className="timeline-progress-fill"
            style={{ width: `${state.progress * 100}%` }}
          />
          <div
            className="timeline-progress-handle"
            style={{ left: `${state.progress * 100}%` }}
          />
        </div>

        <div className="timeline-time">
          <span className="time-elapsed">{formatTime(state.elapsedTime)}</span>
          <span className="time-separator">/</span>
          <span className="time-total">{formatTime(state.totalDuration)}</span>
        </div>
      </div>

      {/* Current Stage Display */}
      <div className="story-current-stage">
        <div className="stage-indicator">
          <span className="stage-number">{state.currentKeyframeIndex + 1}</span>
          <span className="stage-total">/ {story.keyframes.length}</span>
        </div>
        <div className="stage-info">
          <h3 className="stage-label">{state.currentLabel}</h3>
        </div>
      </div>

      {/* Controls */}
      <div className="story-controls">
        <div className="control-group playback">
          <button
            className="control-button"
            onClick={onStop}
            title="Stop"
          >
            ⏹
          </button>

          {state.isPlaying && !state.isPaused ? (
            <button
              className="control-button primary"
              onClick={onPause}
              title="Pause"
            >
              ⏸
            </button>
          ) : (
            <button
              className="control-button primary"
              onClick={onPlay}
              title="Play"
            >
              ▶
            </button>
          )}
        </div>

        <div className="control-group speed">
          <span className="speed-label">Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              className={`speed-button ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Formation Facts */}
      <div className="story-facts">
        <h4>Formation Facts</h4>
        <div className="facts-grid">
          <div className="fact-item">
            <span className="fact-icon">⏱️</span>
            <span className="fact-text">{story.timeScale}</span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">🌡️</span>
            <span className="fact-text">{story.conditions.split(',')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeologicalStoryPanel;
