import React, { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { db } from '../../services/dbAdapter';
import { AuditComment, UserRole } from '../../types';
import { getCurrentUser } from '../../utils/auth';
import { isDOT } from '../../utils/permissions';
import { Button } from '../ui/Button';

interface CommentThreadProps {
  auditId: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ auditId }) => {
  const [comments, setComments] = useState<AuditComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const currentUser = getCurrentUser();
  const userIsDOT = isDOT();

  useEffect(() => {
    loadComments();
  }, [auditId]);

  const loadComments = async () => {
    const allComments = await db.getComments(auditId);
    // Aderente não vê comentários internos
    const visibleComments = userIsDOT 
      ? allComments 
      : allComments.filter(c => !c.isInternal);
    setComments(visibleComments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const user = await db.getUserByEmail(currentUser.email);
    if (!user) return;

    // Get the correct role from user's roles array
    // Check against the actual UserRole enum values
    let userRole = 'Aderente';
    if (user.roles.some(r => r === UserRole.AMONT)) {
      userRole = 'AMONT';
    } else if (user.roles.some(r => r === UserRole.DOT)) {
      userRole = 'DOT';
    } else if (user.roles.some(r => r === UserRole.ADMIN)) {
      userRole = 'ADMIN';
    } else if (user.roles.some(r => r === UserRole.ADERENTE)) {
      userRole = 'Aderente';
    }

    await db.createComment({
      audit_id: auditId,
      user_id: user.id,
      username: user.fullname,
      userRole: userRole,
      comment: newComment.trim(),
      isInternal: isInternal && userIsDOT // Only DOT can mark as internal
    });

    setNewComment('');
    setIsInternal(false);
    await loadComments();
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-gray-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">
          Comentários e Feedback
        </h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.userRole === 'DOT'
                  ? 'bg-blue-50 border-blue-100'
                  : comment.userRole === 'AMONT'
                  ? 'bg-red-50 border-red-100'
                  : comment.userRole === 'ADMIN'
                  ? 'bg-purple-50 border-purple-100'
                  : 'bg-green-50 border-green-100'
              } ${comment.isInternal ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      comment.userRole === 'DOT'
                        ? 'bg-blue-200 text-blue-800'
                        : comment.userRole === 'AMONT'
                        ? 'bg-red-200 text-red-800'
                        : comment.userRole === 'ADMIN'
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {comment.username}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          comment.userRole === 'DOT'
                            ? 'bg-blue-100 text-blue-700'
                            : comment.userRole === 'AMONT'
                            ? 'bg-red-100 text-red-700'
                            : comment.userRole === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {comment.userRole}
                      </span>
                      {comment.isInternal && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                          🔒 Interno
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escrever comentário..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4">
            {userIsDOT && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                🔒 Comentário interno (apenas DOT)
              </label>
            )}
          </div>
          
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim()}
          >
            <Send size={16} className="mr-2" />
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};
