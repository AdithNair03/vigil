"""Intervention Engine — Vowpal Wabbit Contextual Bandit."""

import logging
import random
import hashlib

from config import settings
from models import INTERVENTIONS

logger = logging.getLogger("vigil.intervention.vw")

try:
    import vowpalwabbit
except ImportError:
    vowpalwabbit = None


class VWContextualBandit:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        # LinUCB via VW cb_explore_adf
        if vowpalwabbit:
            try:
                self.vw = vowpalwabbit.Workspace("--cb_explore_adf -q UA")
                self.available = True
            except Exception as e:
                logger.error(f"VW Init failed: {e}")
                self.vw = None
                self.available = False
        else:
             self.vw = None
             self.available = False

    def _convert_to_vw_format(self, user_features: dict, actions: list) -> list:
        vw_examples = []
        u_str = " ".join([f"{k}:{v}" for k,v in user_features.items()])
        vw_examples.append(f"shared |User {u_str}")
        for action in actions:
            vw_examples.append(f"|Action type={action}")
        return vw_examples

    def select_intervention(self, user_features: dict) -> tuple[str, float]:
        """Inference wrapper: returns (chosen_action, probability)."""
        if not self.available or not self.vw:
            # Fallback simple randomizer
            return random.choice(INTERVENTIONS), round(1.0 / len(INTERVENTIONS), 2)
            
        try:
             examples = self._convert_to_vw_format(user_features, INTERVENTIONS)
             # Predict returns list of probabilities per action
             probs = self.vw.predict(examples)
             
             # Sample index from PDF
             r = random.random()
             cum = 0.0
             chosen_idx = 0
             for i, p in enumerate(probs):
                 cum += p
                 if r <= cum:
                     chosen_idx = i
                     break
             return INTERVENTIONS[chosen_idx], probs[chosen_idx]
        except Exception as e:
             logger.error(f"VW inference error: {e}")
             return random.choice(INTERVENTIONS), 0.2

    def learn(self, user_features: dict, chosen_action: str, probability: float, reward: float):
        """Standard VW cost structure: cost = -reward."""
        if not self.available or not self.vw:
            return
            
        try:
            vw_examples = []
            u_str = " ".join([f"{k}:{v}" for k,v in user_features.items()])
            vw_examples.append(f"shared |User {u_str}")
            
            cost = -reward
            for i, action in enumerate(INTERVENTIONS):
                if action == chosen_action:
                    # Provide labeling for the actual taken action
                    vw_examples.append(f"0:{cost}:{probability} |Action type={action}")
                else:
                    vw_examples.append(f"|Action type={action}")
                    
            self.vw.learn(vw_examples)
        except Exception as e:
            logger.error(f"VW learn error: {e}")


_models = {}

def get_bandit(tenant_id: str) -> VWContextualBandit:
    if tenant_id not in _models:
         _models[tenant_id] = VWContextualBandit(tenant_id)
         logger.info(f"VW bandit created for {tenant_id}")
    return _models[tenant_id]


def determine_holdout(user_id: str) -> bool:
    """Deterministic A/B Control/Treatment split.
    If true, user is in control group (holdout), meaning we force NO_ACTION.
    Typically, 10% holdout rate.
    """
    h_val = int(hashlib.sha256(user_id.encode('utf-8')).hexdigest(), 16)
    return (h_val % 100) < 10 # 10%

