// src/components/DashboardCard.tsx
import React, { useState } from "react";
import { ShareDashboard } from "./ShareDashboard";
import { useNavigate } from "react-router-dom";

interface IProps {
  id: string;
  title: string;
  likes: number;
  ownerId: string;
  onLike: (id: string) => void;
  onMakePublic?: (id: string) => void;
}

export const DashboardCard = ({
  id,
  title,
  likes,
  ownerId,
  onLike,
  onMakePublic,
}: IProps) => {
  const navigate = useNavigate();

  // Получаем ID текущего пользователя из токена
  const token = localStorage.getItem("token");
  let currentUserId = "unknown";

  if (token) {
    try {
      // Декодируем JWT токен чтобы получить ID пользователя
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.data?.id || "unknown";
    } catch (error) {
      console.error("Error decoding token:", error);
      currentUserId = "unknown";
    }
  }

  const isOwner = currentUserId === ownerId;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating to parent link
    onLike(id);
  };

  const [showShareForm, setShowShareForm] = useState(false);

  const toggleShareForm = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating to parent link
    setShowShareForm(!showShareForm);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating to parent link
    navigate(`/dashboard/${id}`);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        margin: "12px",
        borderRadius: "8px",
        width: "300px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0" }}>{title}</h3>

      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={handleLikeClick}
          style={{
            background: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            marginRight: "8px",
          }}
        >
          👍 {likes}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log("Make public button clicked", id, onMakePublic); // Debug log
            if (onMakePublic) {
              onMakePublic(id);
            } else {
              console.error("onMakePublic function is not defined");
            }
          }}
          style={{
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            marginRight: "8px",
          }}
        >
          Сделать публичной
        </button>

        <button
          onClick={toggleShareForm}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            marginRight: "8px",
          }}
        >
          Поделиться
        </button>

        <button
          onClick={handleEditClick}
          style={{
            background: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Редактировать
        </button>
      </div>

      {/* Форма для приглашения пользователей */}
      {showShareForm && isOwner && (
        <ShareDashboard dashboardId={id} />
      )}
    </div>
  );
};
