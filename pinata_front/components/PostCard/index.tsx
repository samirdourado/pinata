"use client";

import { useState } from "react";
import { iPost } from "@/interface/post";
import { iComment } from "@/interface/comment";

interface PostCardProps {
  post: iPost;
}

export const PostCard = ({ post }: PostCardProps) => {
  // Estados para likes/dislikes e comentários simulados
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const [comments, setComments] = useState<iComment[]>(post.comments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Manipulador de Upvote / Downvote
  const handleVote = (type: "up" | "down") => {
    if (userVote === type) {
      // Anula o voto
      setUserVote(null);
      if (type === "up") setLikes((prev) => prev - 1);
      if (type === "down") setDislikes((prev) => prev - 1);
    } else {
      if (userVote === "up") setLikes((prev) => prev - 1);
      if (userVote === "down") setDislikes((prev) => prev - 1);

      setUserVote(type);
      if (type === "up") setLikes((prev) => prev + 1);
      if (type === "down") setDislikes((prev) => prev + 1);
    }
  };

  // Simulação de Pagamento & Envio do Comentário
  const handlePayAndComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    // Simula tempo de confirmação da transação na Solana
    setTimeout(() => {
      const addedComment: iComment = {
        id: `comment-${Date.now()}`,
        author: "Você (Você mesmo)",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=You",
        content: newComment,
        paidAmountSol: post.commentFeeSol,
        timestamp: "Agora mesmo",
      };

      setComments((prev) => [addedComment, ...prev]);
      setNewComment("");
      setIsSubmitting(false);

      // Exibe notificação de confirmação
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }, 1200);
  };

  return (
    <article className="w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] p-5 md:p-6 shadow-sm space-y-4">
      {/* Cabeçalho do Post */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.avatar}
            alt={post.author}
            className="w-10 h-10 rounded-full border border-[var(--card-border)] bg-[var(--background)]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--foreground)] text-sm">
                {post.author}
              </span>
              <span className="text-xs text-[var(--muted)]">
                @{post.handle}
              </span>
            </div>
            <span className="text-xs text-[var(--muted)]">
              {post.createdAt}
            </span>
          </div>
        </div>

        {/* Custo de Comentário & Pool Badge */}
        <div className="text-right">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-[var(--primary)] border border-purple-500/20">
            {post.commentFeeSol} SOL / comentário
          </span>
        </div>
      </div>

      {/* Conteúdo do Post */}
      <p className="text-sm md:text-base text-[var(--foreground)] leading-relaxed">
        {post.content}
      </p>

      {/* Ações: Upvote / Downvote & Estatísticas */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)] text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          {/* Botão Upvote */}
          <button
            onClick={() => handleVote("up")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              userVote === "up"
                ? "bg-purple-500/10 border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-[var(--card-border)] hover:border-[var(--muted)] text-[var(--foreground)]"
            }`}
          >
            ▲ <span>{likes}</span>
          </button>

          {/* Botão Downvote */}
          <button
            onClick={() => handleVote("down")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              userVote === "down"
                ? "bg-red-500/10 border-red-500 text-red-500 font-bold"
                : "border-[var(--card-border)] hover:border-[var(--muted)] text-[var(--foreground)]"
            }`}
          >
            ▼ <span>{dislikes}</span>
          </button>
        </div>

        <span className="font-medium">
          💬 {comments.length}{" "}
          {comments.length === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      {/* Formulário de Comentário Pago */}
      <form onSubmit={handlePayAndComment} className="pt-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário de alto valor..."
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Confirmando...</span>
            ) : (
              <>
                <span>Pagar & Comentar</span>
                <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px]">
                  {post.commentFeeSol} SOL
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Toast de Sucesso Simulado */}
      {showSuccessToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-[var(--success)] animate-fade-in">
          ⚡ Transação confirmada! {post.commentFeeSol} SOL divididos entre
          Criador e Piñata Pool.
        </div>
      )}

      {/* Lista de Comentários */}
      {comments.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-[var(--card-border)]">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-6 h-6 rounded-full border border-[var(--card-border)]"
                  />
                  <span className="font-bold text-xs text-[var(--foreground)]">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {comment.timestamp}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-[var(--success)] font-mono font-semibold">
                  ✓ Pago: {comment.paidAmountSol} SOL
                </span>
              </div>
              <p className="text-xs text-[var(--foreground)] pl-8">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
