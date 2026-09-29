# Database Normalization Walkthrough: UNF to BCNF

This document provides a formal database normalization walkthrough for **Chirp**, tracing the schema design from an Unnormalized Form (**UNF**) all the way to Boyce-Codd Normal Form (**BCNF**). It explains the anomalies eliminated at each decomposition step with concrete sample data, formalizes the final relational schemas and functional dependencies, justifies engineering denormalizations, and explains referential integrity mechanisms under table partitioning.

---

## 1. Unnormalized Form (UNF): The Monolithic Table

In an unnormalized design, all domain data—users, their followers, their tweets, associated hashtags, likes, and feed entries—are captured in a single flat representation: `tweets_flat`.

### Sample UNF Data: `tweets_flat`

| tweet_id | user_id | username | email | followers | content | tweet_created_at | hashtags | likes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `t101` | `u1` | `alice` | `alice@mit.edu` | {`bob`, `charlie`} | `Hello #world #db` | 2026-09-01 10:00 | {`#world`, `#db`} | {`bob`, `dave`} |
| `t102` | `u1` | `alice` | `alice@mit.edu` | {`bob`, `charlie`} | `Postgres rules!` | 2026-09-02 11:30 | {} | {`charlie`} |
| `t103` | `u2` | `bob` | `bob@mit.edu` | {`alice`} | `Learning BCNF #db` | 2026-09-02 12:00 | {`#db`} | {} |

### Why UNF Fails
* **Non-Atomic Fields (Repeating Groups)**: Attributes like `followers`, `hashtags`, and `likes` contain multi-valued sets/arrays.
* Relational database engines cannot index, join, or enforce referential integrity across nested, unstructured collections without severe table scan overhead and complex non-standard operators.

---

## 2. Decomposition Step 1: UNF $\to$ 1NF (First Normal Form)

### Definition of 1NF
A relation is in **1NF** if and only if all attribute domains contain only **atomic (indivisible) scalar values**, and there are no repeating groups or arrays.

### Transformation
To transform `tweets_flat` into 1NF, we flatten the repeating groups. Every combination of user, tweet, hashtag, like, and follower is expanded into distinct rows.

### Sample 1NF Table: `flat_1nf`
Primary Key: `(tweet_id, hashtag, like_user_id, follower_user_id)`

| tweet_id | user_id | username | email | content | tweet_created_at | hashtag | like_user_id | follower_user_id |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `t101` | `u1` | `alice` | `alice@mit.edu` | `Hello #world #db` | 2026-09-01 10:00 | `#world` | `bob` | `bob` |
| `t101` | `u1` | `alice` | `alice@mit.edu` | `Hello #world #db` | 2026-09-01 10:00 | `#world` | `bob` | `charlie` |
| `t101` | `u1` | `alice` | `alice@mit.edu` | `Hello #world #db` | 2026-09-01 10:00 | `#world` | `dave` | `bob` |
| `t101` | `u1` | `alice` | `alice@mit.edu` | `Hello #world #db` | 2026-09-01 10:00 | `#world` | `dave` | `charlie` |
| `t101` | `u1` | `alice` | `alice@mit.edu` | `Hello #world #db` | 2026-09-01 10:00 | `#db` | `bob` | `bob` |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Operational Anomalies in 1NF
1. **Insertion Anomaly**: We cannot register a new user who has not yet posted a tweet, because `tweet_id` is part of the primary key and cannot be `NULL`. Similarly, we cannot record a follower or a hashtag without an associated tweet.
2. **Update Anomaly**: If user `alice` changes her email address, we must find and update dozens of Cartesian product rows across every hashtag, like, and follower combination. Missing even one row results in database inconsistency.
3. **Deletion Anomaly**: If tweet `t103` is deleted, all record of user `bob` (`u2`) and his email is completely wiped from the database if that was his only tweet.

---

## 3. Decomposition Step 2: 1NF $\to$ 2NF (Second Normal Form)

### Definition of 2NF
A relation is in **2NF** if:
1. It is in 1NF.
2. No non-prime attribute is **partially dependent** on any candidate key (i.e. every non-prime attribute must depend on the *whole* of every candidate key, not a proper subset).

### Identifying Partial Dependencies in 1NF
In `flat_1nf`, candidate key is `(tweet_id, hashtag, like_user_id, follower_user_id)`.
* $\text{tweet\_id} \to \text{user\_id}, \text{content}, \text{tweet\_created\_at}$ (depends only on part of the key: `tweet_id`).
* $\text{user\_id} \to \text{username}, \text{email}$ (depends only on `user_id`, which is determined by `tweet_id`).
* $(\text{user\_id}, \text{follower\_user\_id})$ determines follow relationship.
* $(\text{tweet\_id}, \text{like\_user\_id})$ determines like relationship.
* $(\text{tweet\_id}, \text{hashtag})$ determines hashtag tagging.

### Decomposition into 2NF Relations
We decompose the relation by separating each partially dependent group into its own relation:

1. `users_2nf`(`user_id`, `username`, `email`) — Key: `user_id`
2. `tweets_2nf`(`tweet_id`, `user_id`, `content`, `tweet_created_at`) — Key: `tweet_id`
3. `follows_2nf`(`follower_id`, `followee_id`, `created_at`) — Key: `(follower_id, followee_id)`
4. `likes_2nf`(`tweet_id`, `user_id`, `created_at`) — Key: `(tweet_id, user_id)`
5. `tweet_hashtags_2nf`(`tweet_id`, `hashtag`) — Key: `(tweet_id, hashtag)`

### Anomalies Fixed by 2NF
* **Insertion**: Users can now register into `users_2nf` without posting a tweet.
* **Deletion**: Deleting a tweet does not delete the author's user profile.
* **Update**: Alice's email exists in exactly one row in `users_2nf`.

---

## 4. Decomposition Step 3: 2NF $\to$ 3NF (Third Normal Form)

### Definition of 3NF
A relation is in **3NF** if:
1. It is in 2NF.
2. For every non-trivial functional dependency $X \to Y$, either:
   * $X$ is a **superkey**, OR
   * $Y$ is a **prime attribute** (part of some candidate key).
*(Equivalently: no non-prime attribute is transitively dependent on a candidate key).*

### Identifying Transitive Dependencies
Consider the hashtag relationship in 2NF:
In `tweet_hashtags_2nf`(`tweet_id`, `hashtag`), `hashtag` strings (e.g. `'#database'`, `'#webdev'`) are repeated across thousands of tweets. If we attach metadata to hashtags (e.g. description, creation date, canonical ID):
* $\text{tweet\_id}, \text{hashtag} \to \text{hashtag\_id}$
* $\text{hashtag\_id} \to \text{hashtag\_name}$
Here, $\text{tweet\_id} \to \text{hashtag\_id} \to \text{hashtag\_name}$ represents a **transitive dependency**.
Storing string tags directly in the junction table creates update and insertion anomalies (cannot store a hashtag without associating it with a tweet).

Similarly, in `tweets`:
* If we store computed or derived columns such as `is_reply` determined by `parent_tweet_id`:
  $\text{id} \to \text{parent\_tweet\_id} \to \text{is\_reply}$
  `parent_tweet_id` is not a superkey, creating a transitive dependency.

### Decomposition into 3NF Relations
We isolate the transitive dependencies:
1. `hashtags`(`id`, `tag`) — Key: `id` (and candidate key `tag`).
2. `tweet_hashtags`(`tweet_id`, `hashtag_id`) — Key: `(tweet_id, hashtag_id)`.
3. In `tweets`, drop redundant derivable flag `is_reply` (or treat it as a deliberate denormalization).

### Anomalies Fixed by 3NF
* **Hashtag Insertion**: A hashtag can exist independently in the system catalog before any tweet references it.
* **Tag Renaming / Merging**: Updating a hashtag name requires updating one row in `hashtags`, rather than thousands of rows in the junction table.

---

## 5. Decomposition Step 4: 3NF $\to$ BCNF (Boyce-Codd Normal Form)

### Definition of BCNF
A relation is in **BCNF** if and only if for every non-trivial functional dependency $X \to Y$, **$X$ is a superkey**.
BCNF is strictly stronger than 3NF because it removes the relaxation where $Y$ could be a prime attribute when $X$ is not a superkey.

### Verification of BCNF in Base Relations
Let us inspect our relations to ensure every determinant is a superkey:

* **`users`**:
  * Candidate Keys: `{id}`, `{username}`, `{email}`.
  * Every FD has a candidate key on the left-hand side ($id \to \dots$, $username \to \dots$, $email \to \dots$).
  * **Result**: In BCNF.

* **`hashtags`**:
  * Candidate Keys: `{id}`, `{tag}`.
  * $id \to tag$ ($id$ is a key), and $tag \to id$ ($tag$ is a key).
  * **Result**: In BCNF.

* **`follows`**:
  * Primary Key: `(follower_id, followee_id)`.
  * The only FD is $(\text{follower\_id}, \text{followee\_id}) \to \text{created\_at}$. The LHS is the primary key.
  * **Result**: In BCNF.

* **`notifications`**:
  * Primary Key: `{id}`.
  * The only determinant for functional dependencies is `id`.
  * Note on Polymorphism: The conditional relationship between `type` and `tweet_id` (a 'follow' has no `tweet_id`, whereas a 'like' requires one) is a **domain / integrity constraint**, not a functional dependency violation, since `type` does not determine a unique `tweet_id`.
  * **Result**: In BCNF.

---

## 6. Final Relation Schemas and Functional Dependencies

The normalized base relations are summarized below. Primary keys are **<u>underlined</u>**, candidate keys are noted, and foreign keys are explicitly identified.

### 1. `users`
$$\text{users}(\underline{\text{id}}, \text{username}, \text{display\_name}, \text{email}, \text{password\_hash}, \text{bio}, \text{location}, \text{website}, \text{avatar\_url}, \text{banner\_url}, \text{is\_verified}, \text{created\_at}, \text{deleted\_at})$$
* **Candidate Keys**: `id`, `username`, `email`
* **FD Set**:
  * $\text{id} \to \text{username}, \text{display\_name}, \text{email}, \text{password\_hash}, \text{bio}, \text{location}, \text{website}, \dots$
  * $\text{username} \to \text{id}, \text{email}, \dots$
  * $\text{email} \to \text{id}, \text{username}, \dots$

### 2. `tweets` (Logical Schema)
$$\text{tweets}(\underline{\text{id}}, \text{user\_id}, \text{content}, \text{parent\_tweet\_id}, \text{created\_at}, \text{deleted\_at})$$
* **Primary Key (Logical)**: `id` *(Physical PK in Postgres is `(id, created_at)` due to range partitioning)*
* **Foreign Keys**: $\text{user\_id} \to \text{users(id)}$
* **FD Set**:
  * $\text{id} \to \text{user\_id}, \text{content}, \text{parent\_tweet\_id}, \text{created\_at}, \text{deleted\_at}$

### 3. `follows`
$$\text{follows}(\underline{\text{follower\_id}}, \underline{\text{followee\_id}}, \text{created\_at})$$
* **Primary Key**: `(follower_id, followee_id)`
* **Foreign Keys**: $\text{follower\_id} \to \text{users(id)}$, $\text{followee\_id} \to \text{users(id)}$
* **FD Set**:
  * $(\text{follower\_id}, \text{followee\_id}) \to \text{created\_at}$

### 4. `likes`
$$\text{likes}(\underline{\text{user\_id}}, \underline{\text{tweet\_id}}, \text{created\_at})$$
* **Primary Key**: `(user_id, tweet_id)`
* **Foreign Keys**: $\text{user\_id} \to \text{users(id)}$
* **FD Set**:
  * $(\text{user\_id}, \text{tweet\_id}) \to \text{created\_at}$

### 5. `retweets`
$$\text{retweets}(\underline{\text{user\_id}}, \underline{\text{tweet\_id}}, \text{quote\_content}, \text{created\_at})$$
* **Primary Key**: `(user_id, tweet_id)`
* **Foreign Keys**: $\text{user\_id} \to \text{users(id)}$
* **FD Set**:
  * $(\text{user\_id}, \text{tweet\_id}) \to \text{quote\_content}, \text{created\_at}$

### 6. `hashtags`
$$\text{hashtags}(\underline{\text{id}}, \text{tag})$$
* **Primary Key**: `id`
* **Candidate Keys**: `id`, `tag`
* **FD Set**:
  * $\text{id} \to \text{tag}$
  * $\text{tag} \to \text{id}$

### 7. `tweet_hashtags`
$$\text{tweet\_hashtags}(\underline{\text{tweet\_id}}, \underline{\text{hashtag\_id}})$$
* **Primary Key**: `(tweet_id, hashtag_id)`
* **Foreign Keys**: $\text{hashtag\_id} \to \text{hashtags(id)}$
* **FD Set**:
  * $(\text{tweet\_id}, \text{hashtag\_id}) \to \emptyset$ (all-key relation)

### 8. `notifications`
$$\text{notifications}(\underline{\text{id}}, \text{user\_id}, \text{actor\_id}, \text{type}, \text{tweet\_id}, \text{is\_read}, \text{created\_at})$$
* **Primary Key**: `id`
* **Foreign Keys**: $\text{user\_id} \to \text{users(id)}$, $\text{actor\_id} \to \text{users(id)}$
* **FD Set**:
  * $\text{id} \to \text{user\_id}, \text{actor\_id}, \text{type}, \text{tweet\_id}, \text{is\_read}, \text{created\_at}$

---

## 7. Deliberate Engineering Denormalizations

In high-throughput distributed systems, strict BCNF purity can introduce intolerable read latencies due to excessive joins and aggregations. Chirp adopts specific, deliberate denormalizations documented below:

| Column / Feature | Table | Relational Form Violated | Engineering Reason & Tradeoff | Integrity Maintenance |
| :--- | :--- | :--- | :--- | :--- |
| `followers_count`, `following_count`, `posts_count` | `users` | Inter-relation aggregate redundancy | **Performance**: Avoids running `COUNT(*)` over millions of rows on profile views. Profile reads are $O(1)$ instead of $O(N)$. | Maintained automatically by PostgreSQL triggers (`trg_incr_followers`, `trg_decr_followers`, `trg_incr_posts`). |
| `like_count`, `retweet_count`, `reply_count` | `tweets` | Inter-relation aggregate redundancy | **Performance**: Feed endpoints render 20–50 tweets per page. Calculating like counts at read time requires 20+ joins/aggregations. | Maintained automatically by triggers (`trg_like_count`, `trg_retweet_count`, `trg_incr_posts`). |
| `search_vector` | `tweets` | 3NF / BCNF ($\text{content} \to \text{search\_vector}$) | **Performance**: Storing precomputed `tsvector` allows GIN indexing for sub-millisecond full-text keyword search. | Generated synchronously on insert/update via trigger `trg_tweets_search_vector`. |
| `tweet_created_at` | `likes`, `retweets`, `tweet_hashtags`, `feed_entries` | 2NF ($\text{tweet\_id} \to \text{tweet\_created\_at}$) | **Partitioning Constraint & Pruning**: PostgreSQL declarative range partitioning requires the partition key (`created_at`) to isolate the scan to the single monthly child table. | Application reads `created_at` from the parent tweet and writes it alongside `tweet_id`. |
| `feed_entries` table | Base relation | Redundant precomputed feed cache | **Fan-out Feed (Write-Time Fan-Out)**: Allows instantaneous home feed reads ($O(1)$ timeline query) compared to dynamic graph pull joins ($O(\text{follows} \times \text{tweets})$). | Populated synchronously on tweet creation via trigger `trg_tweets_fanout`. |

---

## 8. Missing Foreign Keys, Partitioning, and Integrity Enforcement

### The Partitioning Challenge
The `tweets` table is partitioned by range on `created_at` into monthly sub-tables (`tweets_2026_08`, `tweets_2026_09`, etc.):
```sql
CREATE TABLE tweets (
  id UUID DEFAULT gen_random_uuid(),
  ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
```

In relational database management systems (such as PostgreSQL):
1. **Primary Key Requirement**: A primary key or unique constraint on a partitioned table **must include the partition key** (`created_at`). Thus, the physical primary key is composite: `(id, created_at)`.
2. **Foreign Key Target Restriction**: In PostgreSQL, a foreign key in another table can only reference a partitioned table if the foreign key references the complete partitioned key: `FOREIGN KEY (tweet_id, tweet_created_at) REFERENCES tweets(id, created_at)`. A foreign key referencing `id` alone is syntactically rejected because `id` alone cannot have a global unique constraint.
3. **Cross-Partition Self-References**: The recursive reply column `tweets.parent_tweet_id` cannot have a foreign key pointing back to `tweets(id)` for the same reason: a reply created in September (`2026-09`) may reply to a parent tweet created in August (`2026-08`), crossing partition boundaries without storing the parent's creation timestamp.

### Critical Implementation Note: Application-Enforced Partition Keys
In tables like `likes`, `retweets`, `tweet_hashtags`, and `feed_entries`, the column `tweet_created_at` is copied directly. 

> **Important**: These `tweet_created_at` copies currently have **no foreign key constraint** in the database. Instead, referential integrity relies entirely on the application layer reading `created_at` directly from the parent tweet record at write time and supplying both `(tweet_id, tweet_created_at)`. For thread parent links (`parent_tweet_id`), referential validity is validated at the application/trigger layer.

---

## 9. Integrity Fixes (Upcoming Migration 003)

Our audit identified two key integrity and normalization improvements:
1. **`feed_entries.author_id` Removal**: `feed_entries.author_id` is an unnormalized 2NF violation ($tweet\_id \to author\_id$) that is completely unused by feed queries. Removing it saves write I/O on every fan-out insert.
2. **`notifications` Domain CHECK Constraint**: Adding an explicit database integrity constraint:
   ```sql
   ALTER TABLE notifications ADD CONSTRAINT chk_notifications_tweet_target
   CHECK (
     (type = 'follow' AND tweet_id IS NULL) OR
     (type IN ('like', 'retweet', 'reply', 'mention') AND tweet_id IS NOT NULL)
   );
   ```
   This ensures polymorphic notification rows strictly preserve valid state transitions at the database engine level.
