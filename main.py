import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import AsyncIterator, List, Optional

import asyncpg
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field

# --- 設定區 (可透過環境變數覆寫) ---
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_T5mpwOq8geFR@ep-twilight-band-aiff3lv7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
)
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    app.state.db_pool = await asyncpg.create_pool(DATABASE_URL)
    try:
        yield
    finally:
        if hasattr(app.state, "db_pool") and app.state.db_pool is not None:
            await app.state.db_pool.close()


app = FastAPI(title="羽球會員網站 API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db() -> AsyncIterator[asyncpg.Connection]:
    if not hasattr(app.state, "db_pool") or app.state.db_pool is None:
        raise RuntimeError("Database pool is not initialized")

    async with app.state.db_pool.acquire() as connection:
        yield connection


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    if "sub" in to_encode and to_encode["sub"] is not None:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_member(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        member_id = payload.get("sub")
        if member_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無效的憑證",
            )
        return int(str(member_id))
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="憑證已過期或不正確",
        )


class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, description="帳號")
    nickname: str = Field(..., description="暱稱")
    id_card_last3: str = Field(..., min_length=3, max_length=3, description="身分證後三碼")
    card_number: Optional[str] = Field(None, description="卡號")
    phone: str = Field(..., description="電話")


class LoginSchema(BaseModel):
    username: str
    id_card_last3: str


class UpdateMemberProfileSchema(BaseModel):
    nickname: Optional[str] = Field(None, description="暱稱")
    card_number: Optional[str] = Field(None, description="卡號")
    phone: Optional[str] = Field(None, description="電話")
    id_card_last3: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="身分證後三碼",
    )


class AvailabilitySchema(BaseModel):
    monday: bool = False
    tuesday: bool = False
    wednesday: bool = False
    thursday: bool = False
    friday: bool = False
    saturday: bool = False
    sunday: bool = False


class MemberProfileResponseSchema(BaseModel):
    member_id: int
    nickname: str
    card_number: Optional[str] = None
    id_card_last3: str
    availability: AvailabilitySchema
    available_days: List[str]


class MembersListResponseSchema(BaseModel):
    members: List[MemberProfileResponseSchema]


class MessageCreateSchema(BaseModel):
    content: str


class MessageResponseSchema(BaseModel):
    id: int
    nickname: str
    content: str
    created_at: datetime


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register(
    member_data: RegisterSchema,
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    exists = await db.fetchval("SELECT id FROM member WHERE username = $1", member_data.username)
    if exists:
        raise HTTPException(status_code=400, detail="此帳號已被註冊")

    member_id = await db.fetchval(
        """
        INSERT INTO member (username, nickname, id_card_last3, card_number, phone)
        VALUES ($1, $2, $3, $4, $5) RETURNING id;
        """,
        member_data.username,
        member_data.nickname,
        member_data.id_card_last3,
        member_data.card_number,
        member_data.phone,
    )

    await db.execute("INSERT INTO member_availability (member_id) VALUES ($1)", member_id)
    return {"message": "註冊成功", "member_id": member_id}


@app.post("/api/login")
async def login(
    credentials: LoginSchema,
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    member_id = await db.fetchval(
        "SELECT id FROM member WHERE username = $1 AND id_card_last3 = $2",
        credentials.username,
        credentials.id_card_last3,
    )

    if not member_id:
        raise HTTPException(status_code=401, detail="帳號或身分證後三碼錯誤")

    access_token = create_access_token(data={"sub": member_id})
    return {"access_token": access_token, "token_type": "bearer", "message": "登入成功"}


@app.put("/api/member/availability")
async def update_availability(
    availability: AvailabilitySchema,
    current_member_id: int = Depends(get_current_member),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    await db.execute(
        """
        UPDATE member_availability
        SET monday = $1, tuesday = $2, wednesday = $3, thursday = $4, friday = $5,
            saturday = $6, sunday = $7, updated_at = NOW()
        WHERE member_id = $8;
        """,
        availability.monday,
        availability.tuesday,
        availability.wednesday,
        availability.thursday,
        availability.friday,
        availability.saturday,
        availability.sunday,
        current_member_id,
    )
    return {"message": "打球時間更新成功"}


@app.put("/api/member/me")
async def update_member_profile(
    profile_data: UpdateMemberProfileSchema,
    current_member_id: int = Depends(get_current_member),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    if not any(
        [
            profile_data.nickname is not None,
            profile_data.card_number is not None,
            profile_data.phone is not None,
            profile_data.id_card_last3 is not None,
        ]
    ):
        raise HTTPException(status_code=400, detail="至少提供一個要更新的欄位")

    if profile_data.nickname is not None:
        await db.execute("UPDATE member SET nickname = $1 WHERE id = $2", profile_data.nickname, current_member_id)

    if profile_data.card_number is not None:
        await db.execute("UPDATE member SET card_number = $1 WHERE id = $2", profile_data.card_number, current_member_id)

    if profile_data.phone is not None:
        await db.execute("UPDATE member SET phone = $1 WHERE id = $2", profile_data.phone, current_member_id)

    if profile_data.id_card_last3 is not None:
        await db.execute(
            "UPDATE member SET id_card_last3 = $1 WHERE id = $2",
            profile_data.id_card_last3,
            current_member_id,
        )

    return {"message": "會員資料更新成功"}


@app.get("/api/member/me", response_model=MemberProfileResponseSchema)
async def get_member_profile(
    current_member_id: int = Depends(get_current_member),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    row = await db.fetchrow(
        """
        SELECT m.id, m.nickname, m.card_number, m.id_card_last3,
               a.monday, a.tuesday, a.wednesday, a.thursday, a.friday, a.saturday, a.sunday
        FROM member m
        LEFT JOIN member_availability a ON a.member_id = m.id
        WHERE m.id = $1;
        """,
        current_member_id,
    )

    if not row:
        raise HTTPException(status_code=404, detail="找不到會員資料")

    availability = AvailabilitySchema(
        monday=bool(row["monday"]),
        tuesday=bool(row["tuesday"]),
        wednesday=bool(row["wednesday"]),
        thursday=bool(row["thursday"]),
        friday=bool(row["friday"]),
        saturday=bool(row["saturday"]),
        sunday=bool(row["sunday"]),
    )

    day_labels = {
        "monday": "週一",
        "tuesday": "週二",
        "wednesday": "週三",
        "thursday": "週四",
        "friday": "週五",
        "saturday": "週六",
        "sunday": "週日",
    }
    available_days = [
        day_labels[day_name]
        for day_name, is_available in {
            "monday": availability.monday,
            "tuesday": availability.tuesday,
            "wednesday": availability.wednesday,
            "thursday": availability.thursday,
            "friday": availability.friday,
            "saturday": availability.saturday,
            "sunday": availability.sunday,
        }.items()
        if is_available
    ]

    return {
        "member_id": row["id"],
        "nickname": row["nickname"],
        "card_number": row["card_number"],
        "id_card_last3": row["id_card_last3"],
        "availability": availability,
        "available_days": available_days,
    }


@app.get("/api/members", response_model=MembersListResponseSchema)
async def get_all_members(db: asyncpg.Connection = Depends(get_db)) -> dict:
    rows = await db.fetch(
        """
        SELECT m.id, m.nickname, m.card_number, m.id_card_last3,
               a.monday, a.tuesday, a.wednesday, a.thursday, a.friday, a.saturday, a.sunday
        FROM member m
        LEFT JOIN member_availability a ON a.member_id = m.id
        ORDER BY m.id;
        """
    )

    members = []
    for row in rows:
        availability = AvailabilitySchema(
            monday=bool(row["monday"]),
            tuesday=bool(row["tuesday"]),
            wednesday=bool(row["wednesday"]),
            thursday=bool(row["thursday"]),
            friday=bool(row["friday"]),
            saturday=bool(row["saturday"]),
            sunday=bool(row["sunday"]),
        )

        day_labels = {
            "monday": "週一",
            "tuesday": "週二",
            "wednesday": "週三",
            "thursday": "週四",
            "friday": "週五",
            "saturday": "週六",
            "sunday": "週日",
        }
        available_days = [
            day_labels[day_name]
            for day_name, is_available in {
                "monday": availability.monday,
                "tuesday": availability.tuesday,
                "wednesday": availability.wednesday,
                "thursday": availability.thursday,
                "friday": availability.friday,
                "saturday": availability.saturday,
                "sunday": availability.sunday,
            }.items()
            if is_available
        ]

        members.append(
            {
                "member_id": row["id"],
                "nickname": row["nickname"],
                "card_number": row["card_number"],
                "id_card_last3": row["id_card_last3"],
                "availability": availability,
                "available_days": available_days,
            }
        )

    return {"members": members}


@app.post("/api/messages", status_code=status.HTTP_201_CREATED)
async def create_message(
    msg: MessageCreateSchema,
    current_member_id: int = Depends(get_current_member),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    message_id = await db.fetchval(
        "INSERT INTO member_message_board (member_id, content) VALUES ($1, $2) RETURNING id;",
        current_member_id,
        msg.content,
    )
    return {"message": "留言成功", "message_id": message_id}


@app.get("/api/messages", response_model=List[MessageResponseSchema])
async def get_messages(db: asyncpg.Connection = Depends(get_db)) -> List[dict]:
    rows = await db.fetch(
        """
        SELECT b.id, m.nickname, b.content, b.created_at
        FROM member_message_board b
        JOIN member m ON b.member_id = m.id
        ORDER BY b.created_at DESC;
        """
    )
    return [dict(row) for row in rows]