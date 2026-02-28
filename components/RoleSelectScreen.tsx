'use client';

import { useState } from 'react';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface RoleSelectScreenProps {
  pack: ClientStoryPack;
  npcChar: CharacterMeta;
  defaultDisplayName: string;
  defaultCharacterId: string;
  isJoining: boolean;
  onConfirm: (displayName: string, characterId: string) => void;
  loading: boolean;
}

/** Preset roles + custom option */
interface RoleOption {
  id: string;
  label: string;
  description: string;
  defaultName: string;
}

function buildRoleOptions(pack: ClientStoryPack, npcChar: CharacterMeta): RoleOption[] {
  const roles: RoleOption[] = [];

  // Default player character
  roles.push({
    id: pack.playerCharacterId,
    label: pack.playerDisplayName,
    description: '기본 역할',
    defaultName: pack.playerDisplayName,
  });

  // Other NPC characters as potential roles (exclude the active NPC)
  for (const c of pack.characters) {
    if (c.id === npcChar.id) continue;
    roles.push({
      id: c.id,
      label: c.fullName,
      description: c.role,
      defaultName: c.fullName,
    });
  }

  // Custom role
  roles.push({
    id: '__custom__',
    label: '직접 설정',
    description: '이름과 역할을 직접 입력',
    defaultName: '',
  });

  return roles;
}

export default function RoleSelectScreen({
  pack,
  npcChar,
  defaultDisplayName,
  defaultCharacterId,
  isJoining,
  onConfirm,
  loading,
}: RoleSelectScreenProps) {
  const roleOptions = buildRoleOptions(pack, npcChar);
  const [selectedRole, setSelectedRole] = useState(defaultCharacterId);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [customRoleId, setCustomRoleId] = useState('');

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    if (role.id !== '__custom__') {
      setDisplayName(role.defaultName);
    } else {
      setDisplayName('');
    }
  };

  const effectiveCharacterId = selectedRole === '__custom__'
    ? (customRoleId.trim() || 'guest')
    : selectedRole;

  const handleSubmit = () => {
    if (!displayName.trim()) return;
    onConfirm(displayName.trim(), effectiveCharacterId);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 overflow-y-auto">
      <div className="w-full max-w-sm space-y-6 slide-up py-8">
        {/* NPC info */}
        <div className="text-center space-y-3">
          <Avatar className="size-16 mx-auto border-2" style={{ borderColor: `rgba(${npcChar.glowRgb},0.3)` }}>
            <AvatarImage
              src={`${pack.assetsBasePath}${npcChar.image}`}
              alt={npcChar.name}
              className="object-cover object-[50%_15%]"
            />
            <AvatarFallback>{npcChar.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className={`text-lg font-bold ${npcChar.accentText}`}>
              {npcChar.fullName}의 방
            </h2>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">
              {isJoining ? '방에 참가합니다' : '대화를 시작합니다'}
            </p>
          </div>
        </div>

        {/* Role selection */}
        <div className="space-y-2">
          <label className="block text-xs text-[var(--color-text-secondary)]">
            역할 선택
          </label>
          <div className="space-y-1.5">
            {roleOptions.map((role) => (
              <Button
                key={role.id}
                variant="ghost"
                onClick={() => handleRoleSelect(role)}
                className="w-full justify-start h-auto px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: selectedRole === role.id
                    ? `rgba(${npcChar.glowRgb},0.12)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedRole === role.id
                    ? `rgba(${npcChar.glowRgb},0.3)`
                    : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span className={selectedRole === role.id ? npcChar.accentText : 'text-white/80'}>
                  {role.label}
                </span>
                <span className="text-[10px] text-[var(--color-text-dim)] ml-2">
                  {role.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom role ID input (only when custom selected) */}
        {selectedRole === '__custom__' && (
          <div className="space-y-2">
            <label className="block text-xs text-[var(--color-text-secondary)]">
              역할 설명 <span className="text-[var(--color-text-dim)]">(NPC가 이걸 보고 판단합니다)</span>
            </label>
            <Input
              type="text"
              value={customRoleId}
              onChange={(e) => setCustomRoleId(e.target.value)}
              placeholder="예: 경비아저씨, 택배기사, 용준의 형..."
              className="rounded-2xl bg-[var(--color-surface-2)] border-white/[0.06] px-4 py-3 h-auto text-sm placeholder:text-[var(--color-text-dim)]"
              style={{
                borderColor: customRoleId.trim() ? `rgba(${npcChar.glowRgb},0.3)` : undefined,
              }}
            />
          </div>
        )}

        {/* Display name input */}
        <div className="space-y-2">
          <label className="block text-xs text-[var(--color-text-secondary)]">
            표시 이름
          </label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="이름을 입력하세요"
            className="rounded-2xl bg-[var(--color-surface-2)] border-white/[0.06] px-4 py-3 h-auto text-sm placeholder:text-[var(--color-text-dim)]"
            style={{
              borderColor: displayName.trim() ? `rgba(${npcChar.glowRgb},0.3)` : undefined,
            }}
            autoFocus
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={handleSubmit}
          disabled={!displayName.trim() || loading}
          className={`w-full py-4 h-auto rounded-2xl text-sm font-bold tracking-wide ${npcChar.btnBg}`}
          style={{
            boxShadow: displayName.trim() ? `0 0 30px rgba(${npcChar.glowRgb},0.2)` : undefined,
          }}
        >
          {loading ? <><Spinner className="size-4" /> 준비 중...</> : isJoining ? '참가하기' : '대화 시작'}
        </Button>
      </div>
    </div>
  );
}
