#!/usr/bin/env python3
"""
Anki Bridge - Mock implementation for development and testing
This provides a simplified interface that mimics Anki's functionality
without requiring the full Anki library compilation.
"""

import json
import sys
import os
import sqlite3
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from datetime import datetime, timedelta, timezone
import random

# Global bridge instance
_anki_bridge = None

def get_anki_bridge():
    """Get or create the Anki bridge instance"""
    global _anki_bridge
    if _anki_bridge is None:
        _anki_bridge = MockAnkiBridge()
    return _anki_bridge

def import_sample_data() -> Dict[str, Any]:
    """Import sample data for testing"""
    try:
        bridge = get_anki_bridge()
        
        # Load sample data from JSON file
        data_file = Path(__file__).parent.parent.parent / "data" / "sample-data.json"
        
        if not data_file.exists():
            return {
                "success": False,
                "error": f"Sample data file not found: {data_file}"
            }
        
        with open(data_file, 'r', encoding='utf-8') as f:
            sample_data = json.load(f)
        
        decks_data = sample_data.get("decks", [])
        notes_data = sample_data.get("notes", [])
        
        # Create decks
        created_decks = []
        for deck_data in decks_data:
            result = bridge.create_deck(deck_data["name"], deck_data.get("parent_id"))
            if result.get("success"):
                created_decks.append(result["deck"])
        
        # Create notes
        created_notes = []
        for note_data in notes_data:
            result = bridge.add_note(
                note_data["deck_id"], 
                note_data["front"], 
                note_data["back"], 
                note_data.get("tags", [])
            )
            if result.get("success"):
                created_notes.append(result["note"])
        
        # Create user-specific card entries for default user
        user_cards_created = 0
        default_user_id = "default_user"
        now = int(datetime.now().timestamp())
        
        # Get all cards and create user entries for them
        all_cards = bridge.get_cards()
        if all_cards.get("success"):
            for card in all_cards["cards"]:
                # Create user card entry
                try:
                    bridge.db.execute("""
                        INSERT OR IGNORE INTO user_cards 
                        (user_id, card_id, stability, difficulty, state, reps, lapses, due, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        default_user_id,
                        card["id"],
                        0.0,  # Initial stability
                        2.5,  # Initial difficulty
                        "New",  # Initial state
                        0,  # Initial reps
                        0,  # Initial lapses
                        now,  # Due now
                        now,  # Created at
                        now   # Updated at
                    ))
                    user_cards_created += 1
                except Exception as e:
                    print(f"Warning: Could not create user card entry for card {card['id']}: {e}")
        
        bridge.db.commit()
        
        return {
            "success": True,
            "message": "Sample data imported successfully",
            "decks_created": len(created_decks),
            "notes_created": len(created_notes),
            "cards_created": len(created_notes),  # Each note creates one card
            "user_cards_created": user_cards_created
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to import sample data: {str(e)}"
        }

def clear_sample_data() -> Dict[str, Any]:
    """Clear all sample data from the database"""
    try:
        bridge = get_anki_bridge()
        
        # Get counts before clearing
        card_count = bridge.db.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
        note_count = bridge.db.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
        deck_count = bridge.db.execute("SELECT COUNT(*) FROM decks WHERE id > 1").fetchone()[0]  # Keep default deck
        user_card_count = bridge.db.execute("SELECT COUNT(*) FROM user_cards").fetchone()[0]
        user_review_count = bridge.db.execute("SELECT COUNT(*) FROM user_review_logs").fetchone()[0]
        
        # Clear all data except the default deck and user
        bridge.db.execute("DELETE FROM user_review_logs")
        bridge.db.execute("DELETE FROM user_cards")
        bridge.db.execute("DELETE FROM revlog")
        bridge.db.execute("DELETE FROM cards")
        bridge.db.execute("DELETE FROM notes")
        bridge.db.execute("DELETE FROM decks WHERE id > 1")  # Keep default deck (id=1)
        
        # Reset auto-increment counters (only if table exists)
        try:
            bridge.db.execute("DELETE FROM sqlite_sequence WHERE name IN ('cards', 'notes', 'decks', 'user_cards', 'user_review_logs')")
        except Exception as e:
            # sqlite_sequence table might not exist, that's okay
            pass
        
        bridge.db.commit()
        
        return {
            "success": True,
            "message": "Sample data cleared successfully",
            "cleared": {
                "cards": card_count,
                "notes": note_count,
                "decks": deck_count,
                "user_cards": user_card_count,
                "user_reviews": user_review_count
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to clear sample data: {str(e)}"
        }

from fsrs import Scheduler, Card, Rating
import json
from datetime import datetime, timezone
import sys
import traceback
    

class MockAnkiBridge:
    """Mock Anki bridge for development and testing"""
    def __init__(self, db):
        self.db = db
        self.scheduler = Scheduler()
    
    def __init__(self, collection_path: str = None):
        """Initialize the mock Anki bridge with a collection path"""
        self.collection_path = collection_path or self._get_default_collection_path()
        self.db = None
        # Initialize FSRS scheduler
        self.scheduler = Scheduler()
        self._ensure_collection_exists()
        self._initialize_database()
    
    def _get_default_collection_path(self) -> str:
        """Get the default collection path in the data directory"""
        data_dir = Path(__file__).parent.parent.parent / "data"
        return str(data_dir / "collection.anki2")
    
    def _ensure_collection_exists(self):
        """Ensure the collection file exists, create if necessary"""
        collection_file = Path(self.collection_path)
        if not collection_file.exists():
            # Create the parent directory if it doesn't exist
            collection_file.parent.mkdir(parents=True, exist_ok=True)
            # print(f"Creating new mock Anki collection at: {self.collection_path}")
    
    def _initialize_database(self):
        """Initialize the SQLite database with mock Anki structure"""
        try:
            self.db = sqlite3.connect(self.collection_path)
            
            # Create all tables first
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS col (
                    id INTEGER PRIMARY KEY,
                    crt INTEGER NOT NULL,
                    mod INTEGER NOT NULL,
                    scm INTEGER NOT NULL,
                    ver INTEGER NOT NULL,
                    dty INTEGER NOT NULL,
                    usn INTEGER NOT NULL,
                    ls INTEGER NOT NULL,
                    conf TEXT NOT NULL,
                    models TEXT NOT NULL,
                    decks TEXT NOT NULL,
                    dconf TEXT NOT NULL,
                    tags TEXT NOT NULL
                )
            """)
            
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY,
                    guid TEXT NOT NULL,
                    mid INTEGER NOT NULL,
                    mod INTEGER NOT NULL,
                    flds TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    sfld INTEGER NOT NULL,
                    csum INTEGER NOT NULL,
                    flags INTEGER NOT NULL,
                    data TEXT NOT NULL
                )
            """)
            
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS cards (
                    id INTEGER PRIMARY KEY,
                    nid INTEGER NOT NULL,
                    did INTEGER NOT NULL,
                    ord INTEGER NOT NULL,
                    mod INTEGER NOT NULL,
                    type INTEGER NOT NULL,
                    queue INTEGER NOT NULL,
                    due INTEGER NOT NULL,
                    ivl INTEGER NOT NULL,
                    factor REAL NOT NULL,
                    reps INTEGER NOT NULL,
                    lapses INTEGER NOT NULL,
                    left INTEGER NOT NULL,
                    odue INTEGER NOT NULL,
                    odid INTEGER NOT NULL,
                    flags INTEGER NOT NULL,
                    data TEXT NOT NULL
                )
            """)
            
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS revlog (
                    id INTEGER PRIMARY KEY,
                    cid INTEGER NOT NULL,
                    usn INTEGER NOT NULL,
                    ease INTEGER NOT NULL,
                    ivl INTEGER NOT NULL,
                    lastIvl INTEGER NOT NULL,
                    factor REAL NOT NULL,
                    time INTEGER NOT NULL,
                    type INTEGER NOT NULL
                )
            """)
            
            # Add user-specific card tracking table
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS user_cards (
                    id INTEGER PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    card_id INTEGER NOT NULL,
                    stability REAL NOT NULL DEFAULT 0.0,
                    difficulty REAL NOT NULL DEFAULT 2.5,
                    state TEXT NOT NULL DEFAULT 'New',
                    reps INTEGER NOT NULL DEFAULT 0,
                    lapses INTEGER NOT NULL DEFAULT 0,
                    last_review INTEGER,
                    due INTEGER NOT NULL,
                    elapsed_days INTEGER NOT NULL DEFAULT 0,
                    scheduled_days INTEGER NOT NULL DEFAULT 0,
                    fsrs_params TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    fsrs_card_state TEXT,
                    UNIQUE(user_id, card_id)
                )
            """)
            
            # Add user review logs table
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS user_review_logs (
                    id INTEGER PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    card_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    state TEXT NOT NULL,
                    stability REAL NOT NULL,
                    difficulty REAL NOT NULL,
                    elapsed_days INTEGER NOT NULL,
                    scheduled_days INTEGER NOT NULL,
                    review_time INTEGER NOT NULL,
                    created_at INTEGER NOT NULL
                )
            """)
            
            # Add users table
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT,
                    fsrs_params TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            """)
            
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS decks (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    desc TEXT NOT NULL,
                    cards TEXT NOT NULL,
                    conf INTEGER NOT NULL,
                    extendNew INTEGER NOT NULL,
                    extendRev INTEGER NOT NULL,
                    usn INTEGER NOT NULL,
                    collapsed INTEGER NOT NULL,
                    browserCollapsed INTEGER NOT NULL,
                    newToday TEXT NOT NULL,
                    revToday TEXT NOT NULL,
                    lrnToday TEXT NOT NULL,
                    timeToday TEXT NOT NULL,
                    dynamic INTEGER NOT NULL
                )
            """)
            
            self.db.execute("""
                CREATE TABLE IF NOT EXISTS dconf (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    replayq INTEGER NOT NULL,
                    lapse TEXT NOT NULL,
                    rev TEXT NOT NULL,
                    timer INTEGER NOT NULL,
                    maxTaken INTEGER NOT NULL,
                    usn INTEGER NOT NULL,
                    new TEXT NOT NULL,
                    mod INTEGER NOT NULL
                )
            """)
            
            # Insert default collection data if empty
            if not self.db.execute("SELECT COUNT(*) FROM col").fetchone()[0]:
                self.db.execute("""
                    INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
                    VALUES (1, ?, ?, ?, 11, 0, 0, ?, ?, ?, ?, ?, ?)
                """, (
                    int(datetime.now().timestamp()),
                    int(datetime.now().timestamp()),
                    int(datetime.now().timestamp()),
                    int(datetime.now().timestamp()),
                    json.dumps({"nextPos": 1, "estTimes": True, "activeDecks": [1], "sortType": "noteFld", "timeLimit": 0, "sortBackwards": False, "addToCur": True, "curDeck": 1, "newBury": True, "newSpread": 0, "dueCounts": True, "curModel": 1, "collapseTime": 1200}),
                    json.dumps({}),
                    json.dumps({"1": {"name": "Default", "desc": "", "cards": [], "conf": 1, "extendNew": 10, "extendRev": 50, "usn": 0, "collapsed": False, "browserCollapsed": False, "newToday": [0, 0], "revToday": [0, 0], "lrnToday": [0, 0], "timeToday": [0, 0], "dynamic": False, "extendNew": 10, "extendRev": 50}}),
                    json.dumps({"1": {"name": "Default", "replayq": True, "lapse": {"leechFails": 8, "minInt": 1, "leechAction": 0, "mult": 0.5}, "rev": {"perDay": 100, "fuzz": 0.05, "ivlFct": 1, "maxIvl": 36500, "ease4": 1.3, "bury": True, "minSpace": 1}, "timer": 0, "maxTaken": 60, "usn": 0, "new": {"perDay": 20, "delays": [1, 10], "separate": True, "ints": [1, 4, 7], "initialFactor": 2500, "bury": True, "order": 1}, "mod": 0}}),
                    json.dumps({})
                ))
                
                # Create default deck
                self.db.execute("""
                    INSERT INTO decks (id, name, desc, cards, conf, extendNew, extendRev, usn, collapsed, browserCollapsed, newToday, revToday, lrnToday, timeToday, dynamic)
                    VALUES (1, 'Default', '', '[]', 1, 10, 50, 0, 0, 0, '[0, 0]', '[0, 0]', '[0, 0]', '[0, 0]', 0)
                """)
                
                # Create default deck config
                self.db.execute("""
                    INSERT INTO dconf (id, name, replayq, lapse, rev, timer, maxTaken, usn, new, mod)
                    VALUES (1, 'Default', 1, ?, ?, 0, 60, 0, ?, 0)
                """, (
                    json.dumps({"leechFails": 8, "minInt": 1, "leechAction": 0, "mult": 0.5}),
                    json.dumps({"perDay": 100, "fuzz": 0.05, "ivlFct": 1, "maxIvl": 36500, "ease4": 1.3, "bury": True, "minSpace": 1}),
                    json.dumps({"perDay": 20, "delays": [1, 10], "separate": True, "ints": [1, 4, 7], "initialFactor": 2500, "bury": True, "order": 1})
                ))
                
                # Create default user
                default_fsrs_params = {
                    "request_retention": 0.9,
                    "maximum_interval": 36500,
                    "w": [0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],
                    "enable_fuzz": False,
                    "enable_short_term": True,
                    "learning_steps": ["1m", "10m"],
                    "relearning_steps": ["1m", "10m"]
                }
                
                self.db.execute("""
                    INSERT INTO users (id, username, email, fsrs_params, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    "default_user",
                    "default",
                    "default@example.com",
                    json.dumps(default_fsrs_params),
                    int(datetime.now().timestamp()),
                    int(datetime.now().timestamp())
                ))
            
            self.db.commit()
            # print("Mock Anki database initialized successfully")
            
        except Exception as e:
            # print(f"Failed to initialize database: {e}")
            raise
    
    def open_collection(self) -> Dict[str, Any]:
        """Open the Anki collection and return basic info"""
        try:
            if self.db:
                self.db.close()
            
            self.db = sqlite3.connect(self.collection_path)
            
            # Get basic stats
            card_count = self.db.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
            note_count = self.db.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
            deck_count = self.db.execute("SELECT COUNT(*) FROM decks").fetchone()[0]
            
            return {
                "success": True,
                "collection_path": self.collection_path,
                "name": "Mock Anki Collection",
                "card_count": card_count,
                "note_count": note_count,
                "deck_count": deck_count,
                "scheduler_version": 2
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def close_collection(self) -> Dict[str, Any]:
        """Close the Anki collection"""
        try:
            if self.db:
                self.db.close()
                self.db = None
            return {"success": True}
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_decks(self) -> Dict[str, Any]:
        """Get all decks in the collection"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            decks = []
            cursor = self.db.execute("SELECT * FROM decks")
            columns = [description[0] for description in cursor.description]
            
            # Get user-specific statistics
            default_user = "default_user"
            now = int(datetime.now().timestamp())
            
            for row in cursor.fetchall():
                deck_dict = dict(zip(columns, row))
                deck_dict['config'] = self._get_deck_config(deck_dict.get('conf', 1))
                
                # Get user-specific card counts for this deck
                deck_id = deck_dict['id']
                
                # Total cards in deck
                total_cards = self.db.execute("""
                    SELECT COUNT(*) FROM cards WHERE did = ?
                """, (deck_id,)).fetchone()[0]
                
                # Due cards for this user in this deck
                due_cards = self.db.execute("""
                    SELECT COUNT(*) FROM user_cards uc
                    JOIN cards c ON uc.card_id = c.id
                    WHERE uc.user_id = ? AND c.did = ? AND uc.due <= ?
                """, (default_user, deck_id, now)).fetchone()[0]
                
                # Completed cards for this user in this deck
                completed_cards = self.db.execute("""
                    SELECT COUNT(*) FROM user_cards uc
                    JOIN cards c ON uc.card_id = c.id
                    WHERE uc.user_id = ? AND c.did = ? AND uc.reps > 0
                """, (default_user, deck_id)).fetchone()[0]
                
                # Calculate progress percentage
                progress_percentage = 0
                if total_cards > 0:
                    progress_percentage = round((completed_cards / total_cards) * 100)
                
                # Add user-specific statistics
                deck_dict.update({
                    'card_count': total_cards,
                    'due_cards': due_cards,
                    'completed_cards': completed_cards,
                    'progress_percentage': progress_percentage,
                    'is_completed': completed_cards == total_cards and total_cards > 0
                })
                
                decks.append(deck_dict)
            
            return {
                "success": True,
                "decks": decks
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_deck_config(self, config_id: int) -> Dict[str, Any]:
        """Get deck configuration"""
        try:
            cursor = self.db.execute("SELECT * FROM dconf WHERE id = ?", (config_id,))
            row = cursor.fetchone()
            if row:
                columns = [description[0] for description in cursor.description]
                return dict(zip(columns, row))
            return {}
        except:
            return {}
    
    def create_deck(self, name: str, parent_id: Optional[int] = None) -> Dict[str, Any]:
        """Create a new deck"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Get next deck ID
            cursor = self.db.execute("SELECT MAX(id) FROM decks")
            max_id = cursor.fetchone()[0]
            new_id = (max_id or 0) + 1
            
            # Create deck
            self.db.execute("""
                INSERT INTO decks (id, name, desc, cards, conf, extendNew, extendRev, usn, collapsed, browserCollapsed, newToday, revToday, lrnToday, timeToday, dynamic)
                VALUES (?, ?, '', '[]', 1, 10, 50, 0, 0, 0, '[0, 0]', '[0, 0]', '[0, 0]', '[0, 0]', 0)
            """, (new_id, name))
            
            self.db.commit()
            
            return {
                "success": True,
                "deck": {
                    "id": new_id,
                    "name": name,
                    "parent_id": parent_id,
                    "card_count": 0,
                    "children": []
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def add_note(self, deck_id: int, front: str, back: str, tags: List[str] = None) -> Dict[str, Any]:
        """Add a new note to a deck"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            tags = tags or []
            
            # Get next note ID
            cursor = self.db.execute("SELECT MAX(id) FROM notes")
            max_note_id = cursor.fetchone()[0]
            new_note_id = (max_note_id or 0) + 1
            
            # Get next card ID
            cursor = self.db.execute("SELECT MAX(id) FROM cards")
            max_card_id = cursor.fetchone()[0]
            new_card_id = (max_card_id or 0) + 1
            
            # Create note
            guid = f"mock_guid_{new_note_id}"
            fields = f"{front}\x1f{back}"  # Anki uses \x1f as field separator
            tags_str = " ".join(tags) if tags else ""
            
            self.db.execute("""
                INSERT INTO notes (id, guid, mid, mod, flds, tags, sfld, csum, flags, data)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0, '')
            """, (
                new_note_id, guid, int(datetime.now().timestamp()), 
                fields, tags_str, 0, 0
            ))
            
            # Create card
            self.db.execute("""
                INSERT INTO cards (id, nid, did, ord, mod, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
                VALUES (?, ?, ?, 0, ?, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 0, 0, '')
            """, (
                new_card_id, new_note_id, deck_id, int(datetime.now().timestamp())
            ))
            
            self.db.commit()
            
            return {
                "success": True,
                "note": {
                    "note_id": new_note_id,
                    "card_id": new_card_id,
                    "front": front,
                    "back": back,
                    "deck_id": deck_id,
                    "tags": tags
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_notes(self, deck_id: Optional[int] = None, limit: int = 100) -> Dict[str, Any]:
        """Get notes from a specific deck or all notes"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            if deck_id:
                # Get notes from specific deck
                query = """
                    SELECT n.* FROM notes n
                    JOIN cards c ON n.id = c.nid
                    WHERE c.did = ?
                    LIMIT ?
                """
                cursor = self.db.execute(query, (deck_id, limit))
            else:
                # Get all notes
                cursor = self.db.execute("SELECT * FROM notes LIMIT ?", (limit,))
            
            notes = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                note_dict = dict(zip(columns, row))
                note_dict['fields'] = note_dict['flds'].split('\x1f') if note_dict['flds'] else []
                note_dict['tags'] = note_dict['tags'].split() if note_dict['tags'] else []
                notes.append(note_dict)
            
            return {
                "success": True,
                "notes": notes,
                "total_count": len(notes)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_cards(self, deck_id: Optional[int] = None, limit: int = 100) -> Dict[str, Any]:
        """Get cards from a specific deck or all cards"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            if deck_id:
                # Get cards from specific deck
                cursor = self.db.execute("SELECT * FROM cards WHERE did = ? LIMIT ?", (deck_id, limit))
            else:
                # Get all cards
                cursor = self.db.execute("SELECT * FROM cards LIMIT ?", (limit,))
            
            cards = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                card_dict = dict(zip(columns, row))
                cards.append(card_dict)
            
            return {
                "success": True,
                "cards": cards,
                "total_count": len(cards)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_cards_due(self, deck_id: Optional[int] = None, limit: int = 100) -> Dict[str, Any]:
        """Get cards that are due for review"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # For mock implementation, return all cards as "due"
            if deck_id:
                cursor = self.db.execute("SELECT * FROM cards WHERE did = ? LIMIT ?", (deck_id, limit))
            else:
                cursor = self.db.execute("SELECT * FROM cards LIMIT ?", (limit,))
            
            cards = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                card_dict = dict(zip(columns, row))
                # Add mock card data
                card_dict.update({
                    'front': f"Question for card {card_dict['id']}",
                    'back': f"Answer for card {card_dict['id']}",
                    'tags': ['mock']
                })
                cards.append(card_dict)
            
            return {
                "success": True,
                "cards": cards,
                "total_count": len(cards)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_cards_by_deck(self, deck_id: int) -> Dict[str, Any]:
        """Get all cards from a specific deck"""
        return self.get_cards(deck_id)
    
    def answer_card(self, card_id: int, ease: int) -> Dict[str, Any]:
        """Answer a card with ease rating (1-4)"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Mock card answering logic
            current_time = int(datetime.now().timestamp())
            
            # Update card with new interval and due date
            if ease == 1:  # Again
                new_interval = 1
                new_due = current_time + 86400  # 1 day
            elif ease == 2:  # Hard
                new_interval = 3
                new_due = current_time + 259200  # 3 days
            elif ease == 3:  # Good
                new_interval = 7
                new_due = current_time + 604800  # 7 days
            else:  # Easy
                new_interval = 14
                new_due = current_time + 1209600  # 14 days
            
            self.db.execute("""
                UPDATE cards 
                SET ivl = ?, due = ?, factor = ?, reps = reps + 1, mod = ?
                WHERE id = ?
            """, (new_interval, new_due, 2.5, current_time, card_id))
            
            self.db.commit()
            
            # Get updated card
            cursor = self.db.execute("SELECT * FROM cards WHERE id = ?", (card_id,))
            card = cursor.fetchone()
            
            if card:
                columns = [description[0] for description in cursor.description]
                card_dict = dict(zip(columns, card))
                card_dict.update({
                    'front': f"Question for card {card_id}",
                    'back': f"Answer for card {card_id}",
                    'next_review': new_due
                })
                
                return {
                    "success": True,
                    "card": card_dict
                }
            else:
                return {
                    "success": False,
                    "error": "Card not found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_card_stats(self, card_id: int) -> Dict[str, Any]:
        """Get statistics for a specific card"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            cursor = self.db.execute("SELECT * FROM cards WHERE id = ?", (card_id,))
            card = cursor.fetchone()
            
            if card:
                columns = [description[0] for description in cursor.description]
                card_dict = dict(zip(columns, card))
                
                return {
                    "success": True,
                    "stats": {
                        "card_id": card_id,
                        "type": card_dict.get('type', 0),
                        "queue": card_dict.get('queue', 0),
                        "due": card_dict.get('due', 0),
                        "interval": card_dict.get('ivl', 0),
                        "ease_factor": card_dict.get('factor', 2.5),
                        "reps": card_dict.get('reps', 0),
                        "lapses": card_dict.get('lapses', 0),
                        "review_history": []
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "Card not found"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def search_cards(self, query: str, deck_id: Optional[int] = None) -> Dict[str, Any]:
        """Search for cards by query"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Mock search - return all cards for now
            if deck_id:
                cursor = self.db.execute("SELECT * FROM cards WHERE did = ?", (deck_id,))
            else:
                cursor = self.db.execute("SELECT * FROM cards")
            
            cards = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                card_dict = dict(zip(columns, row))
                card_dict.update({
                    'front': f"Question for card {card_dict['id']}",
                    'back': f"Answer for card {card_dict['id']}",
                    'tags': ['mock']
                })
                cards.append(card_dict)
            
            return {
                "success": True,
                "cards": cards,
                "total_count": len(cards)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_models(self) -> Dict[str, Any]:
        """Get all note types (models) in the collection"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Mock models for development
            models = [
                {
                    "id": 1,
                    "name": "Basic",
                    "fields": [{"name": "Front"}, {"name": "Back"}],
                    "templates": [
                        {
                            "name": "Card 1",
                            "qfmt": "{{Front}}",
                            "afmt": "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}"
                        }
                    ],
                    "css": ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
                    "type": 0
                },
                {
                    "id": 2,
                    "name": "Basic (and reversed card)",
                    "fields": [{"name": "Front"}, {"name": "Back"}],
                    "templates": [
                        {
                            "name": "Card 1",
                            "qfmt": "{{Front}}",
                            "afmt": "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}"
                        },
                        {
                            "name": "Card 2",
                            "qfmt": "{{Back}}",
                            "afmt": "{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}"
                        }
                    ],
                    "css": ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
                    "type": 0
                }
            ]
            
            return {
                "success": True,
                "models": models
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            card_count = self.db.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
            note_count = self.db.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
            deck_count = self.db.execute("SELECT COUNT(*) FROM decks").fetchone()[0]
            
            # Calculate user-specific statistics for default user
            default_user = "default_user"
            now = int(datetime.now().timestamp())
            
            # Get total user cards
            total_user_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards WHERE user_id = ?
            """, (default_user,)).fetchone()[0]
            
            # Get due cards (cards that are actually due for review)
            due_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards 
                WHERE user_id = ? AND due <= ?
            """, (default_user, now)).fetchone()[0]
            
            # Get completed cards (cards that have been reviewed at least once)
            completed_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards 
                WHERE user_id = ? AND reps > 0
            """, (default_user,)).fetchone()[0]
            
            # Get cards in learning state
            learning_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards 
                WHERE user_id = ? AND state = 'Learning'
            """, (default_user,)).fetchone()[0]
            
            # Get cards in review state
            review_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards 
                WHERE user_id = ? AND state = 'Review'
            """, (default_user,)).fetchone()[0]
            
            # Get new cards
            new_cards = self.db.execute("""
                SELECT COUNT(*) FROM user_cards 
                WHERE user_id = ? AND state = 'New'
            """, (default_user,)).fetchone()[0]
            
            # Calculate progress percentage
            progress_percentage = 0
            if total_user_cards > 0:
                progress_percentage = round((completed_cards / total_user_cards) * 100)
            
            return {
                "success": True,
                "stats": {
                    "total_cards": card_count,
                    "total_notes": note_count,
                    "total_decks": deck_count,
                    "total_models": 2,  # Mock value
                    "studied_today": "0 cards studied today",
                    "scheduler_version": 2,
                    "v3_scheduler": True,
                    # User-specific statistics
                    "user_stats": {
                        "total_user_cards": total_user_cards,
                        "due_cards": due_cards,
                        "completed_cards": completed_cards,
                        "learning_cards": learning_cards,
                        "review_cards": review_cards,
                        "new_cards": new_cards,
                        "progress_percentage": progress_percentage
                    }
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_user_card(self, user_id: str, card_id: int) -> Dict[str, Any]:
        """Get user-specific card data with FSRS parameters"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Get user card data
            cursor = self.db.execute("""
                SELECT * FROM user_cards 
                WHERE user_id = ? AND card_id = ?
            """, (user_id, card_id))
            
            user_card = cursor.fetchone()
            
            if not user_card:
                # Create new user card entry
                now = int(datetime.now().timestamp())
                self.db.execute("""
                    INSERT INTO user_cards (user_id, card_id, stability, difficulty, state, reps, lapses, due, created_at, updated_at)
                    VALUES (?, ?, 0.0, 2.5, 'New', 0, 0, ?, ?, ?)
                """, (user_id, card_id, now, now, now))
                
                user_card = {
                    'user_id': user_id,
                    'card_id': card_id,
                    'stability': 0.0,
                    'difficulty': 2.5,
                    'state': 'New',
                    'reps': 0,
                    'lapses': 0,
                    'last_review': None,
                    'due': now,
                    'elapsed_days': 0,
                    'scheduled_days': 0
                }
            else:
                columns = [description[0] for description in cursor.description]
                user_card = dict(zip(columns, user_card))
            
            # Get user's FSRS parameters
            cursor = self.db.execute("""
                SELECT fsrs_params FROM users WHERE id = ?
            """, (user_id,))
            
            user_row = cursor.fetchone()
            fsrs_params = json.loads(user_row[0]) if user_row else {}
            
            # Calculate next review info
            next_review_date = datetime.fromtimestamp(user_card['due'])
            days_until_review = (next_review_date - datetime.now()).days
            
            return {
                "success": True,
                "user_card": user_card,
                "fsrs_params": fsrs_params,
                "next_review": {
                    "date": next_review_date.isoformat(),
                    "days_until": days_until_review,
                    "state": user_card['state'],
                    "stability": user_card['stability'],
                    "difficulty": user_card['difficulty']
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def ensure_fsrs_card_state_column(self):
        """Ensure the 'fsrs_card_state' column exists in the user_cards table for FSRS Card serialization."""
        try:
            self.db.execute("ALTER TABLE user_cards ADD COLUMN fsrs_card_state TEXT")
        except Exception as e:
            if "duplicate column name" not in str(e):
                raise

    def answer_card_with_fsrs(self, user_id: str, card_id: int, rating: int):
        """Answer a card with FSRS algorithm for a specific user using py-fsrs"""
        try:
            import sys
            print(f"[DEBUG] answer_card_with_fsrs called with: user_id={user_id}, card_id={card_id}, rating={rating}", file=sys.stderr)
            
            if not self.db:
                print("[ERROR] Database not open", file=sys.stderr)
                return json.dumps({"success": False, "error": "Collection not open"})

            print(f"[DEBUG] Database connection status: {self.db is not None}", file=sys.stderr)
            now_ts = int(datetime.now(timezone.utc).timestamp())
            print(f"[DEBUG] Current timestamp: {now_ts}", file=sys.stderr)

            # Ensure the fsrs_card_state column exists
            print(f"[DEBUG] Ensuring fsrs_card_state column exists", file=sys.stderr)
            self.ensure_fsrs_card_state_column()

            # ✅ Try to get fsrs_card_state from user_cards
            print(f"[DEBUG] Querying user_cards for user_id={user_id}, card_id={card_id}", file=sys.stderr)
            row = self.db.execute("""
                SELECT fsrs_card_state FROM user_cards
                WHERE user_id = ? AND card_id = ?
            """, (user_id, card_id)).fetchone()
            
            print(f"[DEBUG] Query result: {row}", file=sys.stderr)

            # If user card doesn't exist, create it first
            if not row:
                print(f"[DEBUG] User card not found, creating new one for user={user_id}, card={card_id}", file=sys.stderr)
                # 🧠 If user_card doesn't exist, create from base card
                print(f"[DEBUG] Querying base card {card_id}", file=sys.stderr)
                base_card = self.db.execute("SELECT * FROM cards WHERE id = ?", (card_id,)).fetchone()
                print(f"[DEBUG] Base card query result: {base_card}", file=sys.stderr)
                
                if not base_card:
                    print(f"[ERROR] Base card {card_id} not found", file=sys.stderr)
                    return json.dumps({"success": False, "error": "Base card not found"})

                # Create new FSRS card with safe defaults
                print(f"[DEBUG] Creating new FSRS card", file=sys.stderr)
                from fsrs import Card
                fsrs_card = Card()
                
                print(f"[DEBUG] Initial FSRS card state: stability={fsrs_card.stability}, difficulty={fsrs_card.difficulty}", file=sys.stderr)
                
                # ALWAYS ensure stability and difficulty are safe values
                if fsrs_card.stability is None or fsrs_card.stability <= 0:
                    fsrs_card.stability = 0.1  # Safe positive value
                    print(f"[DEBUG] Set stability to safe value: {fsrs_card.stability}", file=sys.stderr)
                if fsrs_card.difficulty is None:
                    fsrs_card.difficulty = 2.5  # Safe default
                    print(f"[DEBUG] Set difficulty to safe value: {fsrs_card.difficulty}", file=sys.stderr)
                if not hasattr(fsrs_card, 'due') or fsrs_card.due is None:
                    fsrs_card.due = datetime.now(timezone.utc)
                    print(f"[DEBUG] Set due to current time: {fsrs_card.due}", file=sys.stderr)
                
                print(f"[DEBUG] Final FSRS card state: stability={fsrs_card.stability}, difficulty={fsrs_card.difficulty}", file=sys.stderr)
                fsrs_card_json = json.dumps(fsrs_card.to_dict())
                print(f"[DEBUG] FSRS card JSON length: {len(fsrs_card_json)}", file=sys.stderr)

                # Insert new user card
                print(f"[DEBUG] Inserting new user card into database", file=sys.stderr)
                self.db.execute("""
                    INSERT INTO user_cards (
                        user_id, card_id, fsrs_card_state,
                        stability, difficulty, state,
                        reps, lapses, due, last_review, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id, card_id, fsrs_card_json,
                    fsrs_card.stability, fsrs_card.difficulty, str(fsrs_card.state),
                    0, 0, now_ts, None, now_ts, now_ts
                ))
                self.db.commit()
                print(f"[DEBUG] Inserted new user card successfully", file=sys.stderr)

                # 🔁 Try fetching again after insert
                print(f"[DEBUG] Fetching user card after insert", file=sys.stderr)
                row = self.db.execute("""
                    SELECT fsrs_card_state FROM user_cards
                    WHERE user_id = ? AND card_id = ?
                """, (user_id, card_id)).fetchone()

                print(f"[DEBUG] Fetch after insert result: {row}", file=sys.stderr)
                if not row:
                    print(f"[ERROR] Failed to fetch card after insert", file=sys.stderr)
                    return json.dumps({"success": False, "error": "Card insert failed"})

            # ✅ Proceed with FSRS review
            print(f"[DEBUG] Starting FSRS review process", file=sys.stderr)
            from fsrs import Card, Rating

            card_state_json = row[0]
            print(f"[DEBUG] Card state JSON: {card_state_json}", file=sys.stderr)
            
            if card_state_json is None:
                print(f"[DEBUG] No existing card state, creating new FSRS card and updating database", file=sys.stderr)
                # Create a fresh card if no state exists
                card = Card()
                card.stability = 0.1
                card.difficulty = 2.5
                card.due = datetime.now(timezone.utc)
                print(f"[DEBUG] Fresh card created: stability={card.stability}, difficulty={card.difficulty}", file=sys.stderr)
                
                # Update the existing user card with the new FSRS state
                print(f"[DEBUG] Updating existing user card with new FSRS state", file=sys.stderr)
                self.db.execute("""
                    UPDATE user_cards 
                    SET fsrs_card_state = ?, updated_at = ?
                    WHERE user_id = ? AND card_id = ?
                """, (
                    json.dumps(card.to_dict()), now_ts,
                    user_id, card_id
                ))
                self.db.commit()
                print(f"[DEBUG] Updated user card with FSRS state", file=sys.stderr)
            else:
                print(f"[DEBUG] Loading card state from JSON: {card_state_json[:100]}...", file=sys.stderr)
                
                try:
                    print(f"[DEBUG] Attempting to deserialize card state", file=sys.stderr)
                    card = Card.from_dict(json.loads(card_state_json))
                    print(f"[DEBUG] Card deserialized successfully", file=sys.stderr)
                except Exception as e:
                    print(f"[ERROR] Failed to deserialize card state: {e}", file=sys.stderr)
                    print(f"[DEBUG] Creating fresh card due to deserialization failure", file=sys.stderr)
                    # Create a fresh card if deserialization fails
                    card = Card()
                    card.stability = 0.1
                    card.difficulty = 2.5
                    card.due = datetime.now(timezone.utc)
                    print(f"[DEBUG] Fresh card created: stability={card.stability}, difficulty={card.difficulty}", file=sys.stderr)
            
            # Ensure card has all required properties initialized safely
            print(f"[DEBUG] Ensuring card properties are safe", file=sys.stderr)
            if card.stability is None or card.stability <= 0:
                card.stability = 0.1
                print(f"[DEBUG] Set stability to safe value: {card.stability}", file=sys.stderr)
            if card.difficulty is None:
                card.difficulty = 2.5
                print(f"[DEBUG] Set difficulty to safe value: {card.difficulty}", file=sys.stderr)
            if not hasattr(card, 'due') or card.due is None:
                card.due = datetime.now(timezone.utc)
                print(f"[DEBUG] Set due to current time: {card.due}", file=sys.stderr)
            
            print(f"[DEBUG] Card before review: stability={card.stability}, difficulty={card.difficulty}, state={card.state}", file=sys.stderr)
            
            rating_enum = Rating(rating)
            print(f"[DEBUG] Rating enum: {rating_enum}", file=sys.stderr)

            # 🔁 Run FSRS algorithm with error handling
            print(f"[DEBUG] About to call scheduler.review_card", file=sys.stderr)
            try:
                card, review_log = self.scheduler.review_card(card, rating_enum)
                print(f"[DEBUG] FSRS review successful", file=sys.stderr)
                print(f"[DEBUG] Card after review: stability={card.stability}, difficulty={card.difficulty}, state={card.state}", file=sys.stderr)
            except Exception as e:
                print(f"[ERROR] FSRS review failed: {e}", file=sys.stderr)
                import traceback
                traceback.print_exc(file=sys.stderr)
                return json.dumps({
                    "success": False, 
                    "error": f"FSRS algorithm error: {str(e)}"
                })

            print(f"[DEBUG] Processing review log", file=sys.stderr)
            due_ts = int(card.due.timestamp())
            log = review_log.to_dict() if review_log else {}
            elapsed_days = log.get("elapsed_days", 0)
            scheduled_days = log.get("scheduled_days", 0)
            review_time = int(log.get("review_time", 0))
            
            print(f"[DEBUG] Calculated values: due_ts={due_ts}, elapsed_days={elapsed_days}, scheduled_days={scheduled_days}", file=sys.stderr)

            print(f"[DEBUG] Card after review: stability={card.stability}, difficulty={card.difficulty}, state={card.state}", file=sys.stderr)

            # Map FSRS state number to string label
            state_map = {
                0: "New",
                1: "Learning",
                2: "Review",
                3: "Relearning"
            }
            state_val = getattr(card, 'state', 0)
            state_label = state_map.get(state_val, str(state_val))

            # Increment reps and lapses
            current_reps = getattr(card, 'reps', 0) + 1
            current_lapses = getattr(card, 'lapses', 0)
            if rating == 1:  # 'Again'
                current_lapses += 1

            # Extract elapsed_days and scheduled_days from review_log
            elapsed_days = 0
            scheduled_days = 0
            if review_log:
                elapsed_days = getattr(review_log, 'elapsed_days', 0)
                scheduled_days = getattr(review_log, 'scheduled_days', 0)

            self.db.execute("""
                UPDATE user_cards 
                SET fsrs_card_state = ?, last_review = ?, due = ?, updated_at = ?,
                    stability = ?, difficulty = ?, state = ?, reps = ?, lapses = ?,
                    elapsed_days = ?, scheduled_days = ?
                WHERE user_id = ? AND card_id = ?
            """, (
                json.dumps(card.to_dict()), now_ts, due_ts, now_ts,
                getattr(card, 'stability', 0), getattr(card, 'difficulty', 2.5), state_label,
                current_reps, current_lapses,
                elapsed_days, scheduled_days,
                user_id, card_id
            ))

            # 🧾 Insert into user_review_logs
            print(f"[DEBUG] Inserting into user_review_logs", file=sys.stderr)
            self.db.execute("""
                INSERT INTO user_review_logs 
                (user_id, card_id, rating, state, stability, difficulty,
                elapsed_days, scheduled_days, review_time, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, card_id, rating, str(card.state), card.stability, card.difficulty,
                elapsed_days, scheduled_days, review_time, now_ts
            ))

            self.db.commit()
            print(f"[DEBUG] Database updated successfully", file=sys.stderr)

            response = {
                "success": True,
                "card": card.to_dict(),
                "log": log
            }
            print(f"[DEBUG] Returning success response", file=sys.stderr)
            return json.dumps(response)

        except Exception as e:
            import sys
            print(f"[ERROR] Exception in answer_card_with_fsrs: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return json.dumps({
                "success": False,
                "error": str(e)
            })

    def get_user_cards_due(self, user_id: str, deck_id: Optional[int] = None, limit: int = 100) -> Dict[str, Any]:
        """Get cards due for review for a specific user"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            now = int(datetime.now().timestamp())
            
            # First, check if user has any cards
            user_card_count = self.db.execute("""
                SELECT COUNT(*) FROM user_cards WHERE user_id = ?
            """, (user_id,)).fetchone()[0]
            
            # If no user cards exist, create them for all existing cards
            if user_card_count == 0:
                all_cards = self.db.execute("SELECT id FROM cards").fetchall()
                for (card_id,) in all_cards:
                    try:
                        self.db.execute("""
                            INSERT OR IGNORE INTO user_cards 
                            (user_id, card_id, stability, difficulty, state, reps, lapses, due, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            user_id,
                            card_id,
                            0.0,  # Initial stability
                            2.5,  # Initial difficulty
                            "New",  # Initial state
                            0,  # Initial reps
                            0,  # Initial lapses
                            now,  # Due now
                            now,  # Created at
                            now   # Updated at
                        ))
                    except Exception as e:
                        import sys
                        print(f"Warning: Could not create user card entry for card {card_id}: {e}", file=sys.stderr)
                
                self.db.commit()
            
            if deck_id:
                # Get cards from specific deck that are due for this user
                cursor = self.db.execute("""
                    SELECT c.*, uc.*, n.flds, n.tags
                    FROM cards c
                    JOIN user_cards uc ON c.id = uc.card_id
                    JOIN notes n ON c.nid = n.id
                    WHERE uc.user_id = ? AND c.did = ? AND uc.due <= ?
                    ORDER BY uc.due ASC
                    LIMIT ?
                """, (user_id, deck_id, now, limit))
            else:
                # Get all cards due for this user
                cursor = self.db.execute("""
                    SELECT c.*, uc.*, n.flds, n.tags
                    FROM cards c
                    JOIN user_cards uc ON c.id = uc.card_id
                    JOIN notes n ON c.nid = n.id
                    WHERE uc.user_id = ? AND uc.due <= ?
                    ORDER BY uc.due ASC
                    LIMIT ?
                """, (user_id, now, limit))
            
            cards = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                card_dict = dict(zip(columns, row))
                
                # Parse note fields
                fields = card_dict['flds'].split('\x1f') if card_dict['flds'] else ['', '']
                tags = card_dict['tags'].split() if card_dict['tags'] else []
                
                # Calculate next review info
                next_review_date = datetime.fromtimestamp(card_dict['due'])
                days_until_review = (next_review_date - datetime.now()).days
                
                cards.append({
                    'card_id': card_dict['id'],
                    'note_id': card_dict['nid'],
                    'deck_id': card_dict['did'],
                    'front': fields[0] if len(fields) > 0 else '',
                    'back': fields[1] if len(fields) > 1 else '',
                    'tags': tags,
                    'user_id': user_id,
                    'stability': card_dict['stability'],
                    'difficulty': card_dict['difficulty'],
                    'state': card_dict['state'],
                    'reps': card_dict['reps'],
                    'lapses': card_dict['lapses'],
                    'due': card_dict['due'],
                    'elapsed_days': card_dict.get('elapsed_days', 0),
                    'scheduled_days': card_dict.get('scheduled_days', 0),
                    'next_review': {
                        'date': next_review_date.isoformat(),
                        'days_until': days_until_review,
                        'state': card_dict['state'],
                        'stability': card_dict['stability'],
                        'difficulty': card_dict['difficulty']
                    }
                })
            
            return {
                "success": True,
                "cards": cards,
                "total_count": len(cards)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        
    
    def get_user_card_review_history(self, user_id: str, card_id: int, limit: int = 50) -> Dict[str, Any]:
        """Get review history for a specific user card"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            # Get review logs for this user and card
            cursor = self.db.execute("""
                SELECT * FROM user_review_logs 
                WHERE user_id = ? AND card_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, card_id, limit))
            
            reviews = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                review_dict = dict(zip(columns, row))
                
                # Convert timestamp to readable date
                review_date = datetime.fromtimestamp(review_dict['created_at'])
                
                reviews.append({
                    'id': review_dict['id'],
                    'rating': review_dict['rating'],
                    'state': review_dict['state'],
                    'stability': review_dict['stability'],
                    'difficulty': review_dict['difficulty'],
                    'elapsed_days': review_dict['elapsed_days'],
                    'scheduled_days': review_dict['scheduled_days'],
                    'review_time': review_dict['review_time'],
                    'created_at': review_dict['created_at'],
                    'review_date': review_date.isoformat(),
                    'rating_text': self._get_rating_text(review_dict['rating']),
                    'state_text': self._get_state_text(review_dict['state'])
                })
            
            return {
                "success": True,
                "reviews": reviews,
                "total_count": len(reviews)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_rating_text(self, rating: int) -> str:
        """Convert rating number to text"""
        rating_map = {
            1: "Again",
            2: "Hard", 
            3: "Good",
            4: "Easy"
        }
        return rating_map.get(rating, f"Rating {rating}")
    
    def _get_state_text(self, state: str) -> str:
        """Convert state to readable text"""
        state_map = {
            "New": "New Card",
            "Learning": "Learning",
            "Review": "Review",
            "Relearning": "Relearning"
        }
        return state_map.get(state, state)

    def get_detailed_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get detailed user statistics including FSRS parameters and next review times"""
        try:
            if not self.db:
                return {"success": False, "error": "Collection not open"}
            
            now = int(datetime.now().timestamp())
            
            # Get all user cards with their current state
            cursor = self.db.execute("""
                SELECT uc.*, c.did, n.flds, n.tags
                FROM user_cards uc
                JOIN cards c ON uc.card_id = c.id
                JOIN notes n ON c.nid = n.id
                WHERE uc.user_id = ?
                ORDER BY uc.last_review DESC
            """, (user_id,))
            
            user_cards = []
            columns = [description[0] for description in cursor.description]
            
            for row in cursor.fetchall():
                card_dict = dict(zip(columns, row))
                
                # Parse note fields
                fields = card_dict['flds'].split('\x1f') if card_dict['flds'] else ['', '']
                tags = card_dict['tags'].split() if card_dict['tags'] else []
                
                # Calculate next review info
                next_review_date = datetime.fromtimestamp(card_dict['due'])
                days_until_review = (next_review_date - datetime.now()).days
                
                # Get recent review history for this card
                review_cursor = self.db.execute("""
                    SELECT * FROM user_review_logs 
                    WHERE user_id = ? AND card_id = ?
                    ORDER BY created_at DESC
                    LIMIT 5
                """, (user_id, card_dict['card_id']))
                
                recent_reviews = []
                review_columns = [description[0] for description in review_cursor.description]
                for review_row in review_cursor.fetchall():
                    review_dict = dict(zip(review_columns, review_row))
                    review_date = datetime.fromtimestamp(review_dict['created_at'])
                    recent_reviews.append({
                        'rating': review_dict['rating'],
                        'rating_text': self._get_rating_text(review_dict['rating']),
                        'state': review_dict['state'],
                        'stability': review_dict['stability'],
                        'difficulty': review_dict['difficulty'],
                        'review_date': review_date.isoformat(),
                        'days_ago': (datetime.now() - review_date).days
                    })
                
                user_cards.append({
                    'card_id': card_dict['card_id'],
                    'deck_id': card_dict['did'],
                    'front': fields[0] if len(fields) > 0 else '',
                    'back': fields[1] if len(fields) > 1 else '',
                    'tags': tags,
                    'stability': card_dict['stability'],
                    'difficulty': card_dict['difficulty'],
                    'state': card_dict['state'],
                    'reps': card_dict['reps'],
                    'lapses': card_dict['lapses'],
                    'due': card_dict['due'],
                    'elapsed_days': card_dict['elapsed_days'],
                    'scheduled_days': card_dict['scheduled_days'],
                    'last_review': card_dict['last_review'],
                    'next_review': {
                        'date': next_review_date.isoformat(),
                        'days_until': days_until_review,
                        'state': card_dict['state'],
                        'stability': card_dict['stability'],
                        'difficulty': card_dict['difficulty']
                    },
                    'recent_reviews': recent_reviews,
                    'is_completed': card_dict['reps'] > 0,
                    'is_due': card_dict['due'] <= now
                })
            
            # Calculate summary statistics
            total_cards = len(user_cards)
            completed_cards = len([c for c in user_cards if c['is_completed']])
            due_cards = len([c for c in user_cards if c['is_due']])
            learning_cards = len([c for c in user_cards if c['state'] == 'Learning'])
            review_cards = len([c for c in user_cards if c['state'] == 'Review'])
            new_cards = len([c for c in user_cards if c['state'] == 'New'])
            
            # Calculate average FSRS parameters
            if completed_cards > 0:
                avg_stability = sum(c['stability'] for c in user_cards if c['is_completed']) / completed_cards
                avg_difficulty = sum(c['difficulty'] for c in user_cards if c['is_completed']) / completed_cards
            else:
                avg_stability = 0
                avg_difficulty = 2.5
            
            # Get cards due soon (next 7 days)
            cards_due_soon = [c for c in user_cards if 0 <= c['next_review']['days_until'] <= 7]
            
            # Get recently completed cards (last 7 days)
            week_ago = now - (7 * 24 * 60 * 60)
            recently_completed = [c for c in user_cards if c['is_completed'] and c['last_review'] and c['last_review'] >= week_ago]
            
            return {
                "success": True,
                "summary": {
                    "total_cards": total_cards,
                    "completed_cards": completed_cards,
                    "due_cards": due_cards,
                    "learning_cards": learning_cards,
                    "review_cards": review_cards,
                    "new_cards": new_cards,
                    "progress_percentage": round((completed_cards / total_cards * 100) if total_cards > 0 else 0, 1),
                    "avg_stability": round(avg_stability, 2),
                    "avg_difficulty": round(avg_difficulty, 2),
                    "cards_due_soon": len(cards_due_soon),
                    "recently_completed": len(recently_completed)
                },
                "cards": user_cards,
                "cards_due_soon": cards_due_soon,
                "recently_completed": recently_completed
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

def main():
    """Main function to handle command-line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    bridge = MockAnkiBridge()
    
    try:
        if command == "open":
            result = bridge.open_collection()
        elif command == "close":
            result = bridge.close_collection()
        elif command == "decks":
            result = bridge.get_decks()
        elif command == "create_deck":
            if len(sys.argv) < 3:
                result = {"success": False, "error": "Deck name required"}
            else:
                name = sys.argv[2]
                parent_id = int(sys.argv[3]) if len(sys.argv) > 3 else None
                result = bridge.create_deck(name, parent_id)
        elif command == "notes":
            deck_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            result = bridge.get_notes(deck_id, limit)
        elif command == "cards":
            deck_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            result = bridge.get_cards(deck_id, limit)
        elif command == "cards_due":
            deck_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            result = bridge.get_cards_due(deck_id, limit)
        elif command == "cards_by_deck":
            deck_id = int(sys.argv[2])
            result = bridge.get_cards_by_deck(deck_id)
        elif command == "answer_card":
            card_id = int(sys.argv[2])
            ease = int(sys.argv[3])
            result = bridge.answer_card(card_id, ease)
        elif command == "card_stats":
            card_id = int(sys.argv[2])
            result = bridge.get_card_stats(card_id)
        elif command == "search_cards":
            query = sys.argv[2]
            deck_id = int(sys.argv[3]) if len(sys.argv) > 3 else None
            result = bridge.search_cards(query, deck_id)
        elif command == "models":
            result = bridge.get_models()
        elif command == "stats":
            result = bridge.get_stats()
        elif command == "get_user_card":
            user_id = sys.argv[2]
            card_id = int(sys.argv[3])
            result = bridge.get_user_card(user_id, card_id)
        elif command == "answer_card_with_fsrs":
            user_id = sys.argv[2]
            card_id = int(sys.argv[3])
            rating = int(sys.argv[4])
            result = bridge.answer_card_with_fsrs(user_id, card_id, rating)
        elif command == "get_user_cards_due":
            user_id = sys.argv[2]
            deck_id = int(sys.argv[3]) if len(sys.argv) > 3 else None
            limit = int(sys.argv[4]) if len(sys.argv) > 4 else 100
            result = bridge.get_user_cards_due(user_id, deck_id, limit)
        elif command == "get_user_card_review_history":
            user_id = sys.argv[2]
            card_id = int(sys.argv[3])
            limit = int(sys.argv[4]) if len(sys.argv) > 4 else 50
            result = bridge.get_user_card_review_history(user_id, card_id, limit)
        elif command == "get_detailed_user_stats":
            user_id = sys.argv[2]
            result = bridge.get_detailed_user_stats(user_id)
        else:
            result = {"error": f"Unknown command: {command}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main() 