import pandas as pd
import numpy as np
import requests
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier
from river import linear_model, preprocessing, metrics, compose

# URL for the IBM Telco Churn dataset
DATA_URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
CSV_PATH = "Telco-Customer-Churn.csv"

def download_data():
    print(f"Downloading dataset from {DATA_URL}...")
    response = requests.get(DATA_URL)
    with open(CSV_PATH, 'wb') as f:
        f.write(response.content)
    print("Download complete.")

def preprocess_data():
    df = pd.read_csv(CSV_PATH)
    
    # Select features
    features = [
        'tenure', 'MonthlyCharges', 'TotalCharges', 'Contract', 
        'PaymentMethod', 'InternetService', 'OnlineSecurity', 
        'TechSupport', 'StreamingTV', 'StreamingMovies'
    ]
    target = 'Churn'
    
    # Handle TotalCharges numeric conversion
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df = df.dropna(subset=['TotalCharges'] + [target])
    
    # Encode target
    df[target] = df[target].map({'Yes': 1, 'No': 0})
    
    X = df[features]
    y = df[target]
    
    # Categorical encoding for batch models
    X_encoded = pd.get_dummies(X, columns=[
        'Contract', 'PaymentMethod', 'InternetService', 
        'OnlineSecurity', 'TechSupport', 'StreamingTV', 'StreamingMovies'
    ])
    
    return train_test_split(X_encoded, y, test_size=0.3, random_state=42), X, y

def evaluate_river(X_raw, y_raw):
    print("Evaluating River LogisticRegression (Online Learning)...")
    
    # Separate numerical and categorical features for River pipeline
    num = compose.Select('tenure', 'MonthlyCharges', 'TotalCharges') | preprocessing.StandardScaler()
    cat = compose.Select('Contract', 'PaymentMethod', 'InternetService', 'OnlineSecurity', 'TechSupport', 'StreamingTV', 'StreamingMovies') | preprocessing.OneHotEncoder()
    
    model = (num + cat) | linear_model.LogisticRegression()
    
    acc = metrics.Accuracy()
    prec = metrics.Precision()
    rec = metrics.Recall()
    f1 = metrics.F1()
    roc = metrics.ROCAUC()
    
    learning_curve = {}
    checkpoints = [100, 500, 1000, 2000, 5000]
    
    # Convert back to list of dicts for River
    data_stream = X_raw.to_dict('records')
    labels = y_raw.tolist()
    
    # We'll use the whole dataset for online learning to show the curve, 
    # but we'll report final metrics on the "test" portion later if we wanted consistency.
    # However, online learning usually evaluates while it learns.
    # We'll split the data similar to batch for evaluation to be fair.
    
    train_size = int(len(data_stream) * 0.7)
    train_x, test_x = data_stream[:train_size], data_stream[train_size:]
    train_y, test_y = labels[:train_size], labels[train_size:]
    
    print("Training River...")
    for i, (x, y) in enumerate(zip(train_x, train_y)):
        model.learn_one(x, y)
        acc.update(y, model.predict_one(x))
        
        current_step = i + 1
        if current_step in checkpoints:
            learning_curve[current_step] = round(acc.get(), 4)
            print(f"Checkpoint {current_step}: Accuracy = {learning_curve[current_step]}")

    print("Evaluating River on test set...")
    # Reset metrics for test set evaluation to be comparable with batch
    acc = metrics.Accuracy()
    prec = metrics.Precision()
    rec = metrics.Recall()
    f1 = metrics.F1()
    roc = metrics.ROCAUC()
    
    for x, y in zip(test_x, test_y):
        y_pred_one = model.predict_one(x)
        y_pred_proba = model.predict_proba_one(x).get(1, 0.0)
        
        acc.update(y, y_pred_one)
        prec.update(y, y_pred_one)
        rec.update(y, y_pred_one)
        f1.update(y, y_pred_one)
        roc.update(y, y_pred_proba)
        
        # In online learning we can continue to learn on the test set if we wanted, 
        # but for a fair comparison we'll just predict.
        
    return {
        "Accuracy": round(acc.get(), 4),
        "Precision": round(prec.get(), 4),
        "Recall": round(rec.get(), 4),
        "F1": round(f1.get(), 4),
        "AUC-ROC": round(roc.get(), 4)
    }, learning_curve

def main():
    download_data()
    (X_train, X_test, y_train, y_test), X_raw, y_raw = preprocess_data()
    
    results = {}
    
    # 1. Logistic Regression (sklearn)
    print("Training Logistic Regression (sklearn)...")
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X_train, y_train)
    y_pred = lr.predict(X_test)
    y_proba = lr.predict_proba(X_test)[:, 1]
    results["Logistic Regression (sklearn)"] = {
        "Accuracy": round(accuracy_score(y_test, y_pred), 4),
        "Precision": round(precision_score(y_test, y_pred), 4),
        "Recall": round(recall_score(y_test, y_pred), 4),
        "F1": round(f1_score(y_test, y_pred), 4),
        "AUC-ROC": round(roc_auc_score(y_test, y_proba), 4)
    }
    
    # 2. Random Forest (sklearn)
    print("Training Random Forest (sklearn)...")
    rf = RandomForestClassifier(random_state=42)
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_test)
    y_proba = rf.predict_proba(X_test)[:, 1]
    results["Random Forest (sklearn)"] = {
        "Accuracy": round(accuracy_score(y_test, y_pred), 4),
        "Precision": round(precision_score(y_test, y_pred), 4),
        "Recall": round(recall_score(y_test, y_pred), 4),
        "F1": round(f1_score(y_test, y_pred), 4),
        "AUC-ROC": round(roc_auc_score(y_test, y_proba), 4)
    }
    
    # 3. XGBoost
    print("Training XGBoost...")
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    xgb.fit(X_train, y_train)
    y_pred = xgb.predict(X_test)
    y_proba = xgb.predict_proba(X_test)[:, 1]
    results["XGBoost"] = {
        "Accuracy": round(accuracy_score(y_test, y_pred), 4),
        "Precision": round(precision_score(y_test, y_pred), 4),
        "Recall": round(recall_score(y_test, y_pred), 4),
        "F1": round(f1_score(y_test, y_pred), 4),
        "AUC-ROC": round(roc_auc_score(y_test, y_proba), 4)
    }
    
    # 4. River
    river_metrics, river_curve = evaluate_river(X_raw, y_raw)
    results["River LogisticRegression"] = river_metrics
    
    # Save results
    with open("comparison_results.json", "w") as f:
        json.dump(results, f, indent=4)
    
    with open("learning_curve.json", "w") as f:
        json.dump(river_curve, f, indent=4)
        
    print("\n--- COMPARISON RESULTS ---")
    print(json.dumps(results, indent=4))
    
    print("\n--- RIVER LEARNING CURVE ---")
    print(json.dumps(river_curve, indent=4))
    
    # Cleanup
    if os.path.exists(CSV_PATH):
        os.remove(CSV_PATH)

if __name__ == "__main__":
    main()
