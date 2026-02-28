'use client';

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { CharacterMeta } from '@/lib/story-pack';
import { Input } from '@/components/ui/input';
import { CharAvatar } from './MessageBubble';

interface MentionInputProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMentionSelect?: (charId: string) => void;
  npcChars: CharacterMeta[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(
  function MentionInput({ value, onChange, onKeyDown, onMentionSelect, npcChars, disabled, placeholder, className, style }, ref) {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [showDropdown, setShowDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);

    // Don't show mention UI if only 1 NPC
    const mentionEnabled = npcChars.length > 1;

    const filtered = mentionEnabled
      ? npcChars.filter((c) =>
          c.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          c.fullName.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      // Ensure input scrolls to caret (some chars like "?" don't trigger auto-scroll)
      const el = e.target;
      requestAnimationFrame(() => { el.scrollLeft = el.scrollWidth; });

      if (!mentionEnabled) return;

      const cursorPos = e.target.selectionStart ?? newVal.length;
      // Find @ before cursor
      const beforeCursor = newVal.slice(0, cursorPos);
      const atIdx = beforeCursor.lastIndexOf('@');

      if (atIdx >= 0 && (atIdx === 0 || beforeCursor[atIdx - 1] === ' ')) {
        const query = beforeCursor.slice(atIdx + 1);
        if (!query.includes(' ')) {
          setMentionStart(atIdx);
          setMentionQuery(query);
          setShowDropdown(true);
          setSelectedIdx(0);
          return;
        }
      }

      setShowDropdown(false);
    }, [onChange, mentionEnabled]);

    const selectMention = useCallback((char: CharacterMeta) => {
      if (mentionStart < 0) return;
      const before = value.slice(0, mentionStart);
      const cursorPos = innerRef.current?.selectionStart ?? value.length;
      const after = value.slice(cursorPos);
      const newVal = `${before}@${char.name} ${after}`;
      onChange(newVal);
      setShowDropdown(false);
      onMentionSelect?.(char.id);

      // Move cursor after the inserted mention
      requestAnimationFrame(() => {
        const pos = before.length + char.name.length + 2; // @name + space
        innerRef.current?.setSelectionRange(pos, pos);
        innerRef.current?.focus();
      });
    }, [mentionStart, value, onChange, onMentionSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (showDropdown && filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIdx((i) => (i + 1) % filtered.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          selectMention(filtered[selectedIdx]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }
      onKeyDown?.(e);
    }, [showDropdown, filtered, selectedIdx, selectMention, onKeyDown]);

    // Close dropdown on blur after a small delay (allow click)
    useEffect(() => {
      if (!showDropdown) return;
      const handleClickOutside = () => setShowDropdown(false);
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, { once: true });
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }, [showDropdown]);

    return (
      <div className="relative flex-1">
        <Input
          ref={innerRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
          style={style}
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-50">
            {filtered.map((char, idx) => (
              <button
                key={char.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  selectMention(char);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  idx === selectedIdx ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <CharAvatar char={char} size={24} />
                <span className={`text-sm ${char.accentText}`}>{char.name}</span>
                <span className="text-[10px] text-white/30">{char.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
