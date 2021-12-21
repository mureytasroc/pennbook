
import torch
from fastapi import FastAPI, Request
import numpy as np

app = FastAPI()

class AdModel(torch.nn.Module):
    def __init__(self):
        super(AdModel, self).__init__()
        self.layers = torch.nn.Sequential(
            torch.nn.Linear(41, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 40),
            torch.nn.ReLU(),
        )

    def forward(self, x):
        return self.layers(x)

@app.post("/predict")
async def predict_ads(request: Request):
    data = await request.json()

    # Load latest model from s3
    model = AdModel()

    model.load_state_dict(torch.load("ad_model.pt"))
    model.eval()

    tdata = torch.from_numpy(np.array(data['interests']))

    # Predict
    op = model(tdata.float()).detach().numpy()

    # Remove those categories with negative or low likelihood

    op[op < 0.05] = 0

    # Normalize to give probability distribution    

    dist = op / np.linalg.norm(op, ord=1)
    return {"Prediction": dist.tolist()}